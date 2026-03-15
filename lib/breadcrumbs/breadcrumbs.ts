export type BreadcrumbItem = {
    label: string
    href?: string
    current: boolean
}

export function buildBreadcrumbs(
    pathname: string,
    patientName?: string,
): BreadcrumbItem[] {
    const segments = pathname.split("/").filter(Boolean)

    const base: BreadcrumbItem = {
        label: "Pacientes",
        href: "/patients",
        current: false,
    }

    // Exact list view
    if (pathname === "/patients") {
        return [{ label: "Pacientes", current: true }]
    }

    const crumbs: BreadcrumbItem[] = [base]

    // /patients/{id}
    const patientId = segments[1]
    if (patientId) {
        const patientCrumb: BreadcrumbItem = {
            label: patientName ?? "Paciente",
            href: `/patients/${patientId}`,
            current: false,
        }

        // If this is the last segment, it is current.
        if (segments.length === 2) {
            patientCrumb.current = true
            // current crumb must not have an href
            patientCrumb.href = undefined
        }

        crumbs.push(patientCrumb)
    }

    // /patients/{id}/{sub}
    const thirdSegment = segments[2]
    if (thirdSegment) {
        const label = (() => {
            switch (thirdSegment) {
                case "encounters":
                    return "Encuentros"
                case "vital-signs":
                    return "Signos vitales"
                case "assessments":
                    return "Evaluaciones"
                default:
                    return `${thirdSegment.charAt(0).toUpperCase()}${thirdSegment.slice(1)}`
            }
        })()

        crumbs.push({
            label,
            current: true,
        })
    }

    return crumbs
}
