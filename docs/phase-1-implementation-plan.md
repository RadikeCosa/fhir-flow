"use server"

import { revalidatePath, redirect } from "next/navigation"
import { createEncounterFormSchema } from "./create-encounter-form.schema"
import { ActionResult } from "@/domain/shared/action-result.types"
import { EncounterInput } from "@/domain/encounters/encounter.write-input"
import { validateEncounterRules } from "@/domain/shared/domain-rules.validator"
import { DomainRuleError } from "@/domain/shared/error-types"
import { encounterRepository } from "@/infrastructure/repositories"

export async function createEncounterAction(
  patientId: string,
  episodeOfCareId: string,
  formData: unknown
): Promise<ActionResult<{ encounterId: string }>> {
  // Layer 1: Zod validation
  const parseResult = createEncounterFormSchema.safeParse(formData)
  if (!parseResult.success) {
    return {
      success: false,
      error: { layer: "validation", message: "Invalid form data" }
    }
  }
  
  // Layer 2: Domain rules
  const input: EncounterInput = {
    patientId,
    episodeOfCareId,
    performerId: process.env.CURRENT_PRACTITIONER_ID!,
    visitType: parseResult.data.visitType,
    periodStart: parseResult.data.plannedDate.toISOString(),
    clinicalNote: parseResult.data.clinicalNote || null
  }
  
  try {
    validateEncounterRules(input)
  } catch (error) {
    if (error instanceof DomainRuleError) {
      return { success: false, error: { layer: "domain", message: error.message, code: error.code } }
    }
    throw error
  }
  
  // Layer 3: Repository (maps + FHIR)
  const result = await encounterRepository.create(input)
  
  if (result.success) {
    revalidatePath(`/patients/${patientId}`)
    redirect(`/patients/${patientId}/encounters/${result.data.encounterId}`)
  }
  
  return result
}