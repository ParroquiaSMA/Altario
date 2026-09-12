// Comprehensive world countries, phone codes, currencies, and major cities for Altario CMS

export interface CountryData {
  code: string
  name: string
  phoneCode: string
  currency: string
  defaultTz: string
  cities: string[]
}

export const WORLD_COUNTRIES: CountryData[] = [
  {
    code: "UY",
    name: "Uruguay",
    phoneCode: "+598",
    currency: "UYU",
    defaultTz: "America/Montevideo",
    cities: [
      "Montevideo",
      "Salto",
      "Ciudad de la Costa",
      "Paysandú",
      "Las Piedras",
      "Rivera",
      "Maldonado",
      "Tacuarembó",
      "Melo",
      "Mercedes",
      "Artigas",
      "Minas",
      "San José de Mayo",
      "Durazno",
      "Punta del Este",
      "Colonia del Sacramento",
    ],
  },
  {
    code: "AR",
    name: "Argentina",
    phoneCode: "+54",
    currency: "ARS",
    defaultTz: "America/Argentina/Buenos_Aires",
    cities: [
      "Buenos Aires",
      "Córdoba",
      "Rosario",
      "Mendoza",
      "La Plata",
      "San Miguel de Tucumán",
      "Mar del Plata",
      "Salta",
      "Santa Fe",
      "San Juan",
      "Resistencia",
      "Corrientes",
      "Posadas",
      "San Salvador de Jujuy",
      "Bahía Blanca",
      "Paraná",
      "Neuquén",
      "Bariloche",
      "Ushuaia",
    ],
  },
  {
    code: "MX",
    name: "México",
    phoneCode: "+52",
    currency: "MXN",
    defaultTz: "America/Mexico_City",
    cities: [
      "Ciudad de México",
      "Guadalajara",
      "Monterrey",
      "Puebla",
      "Tijuana",
      "León",
      "Ciudad Juárez",
      "Zapopan",
      "Mérida",
      "San Luis Potosí",
      "Querétaro",
      "Cancún",
    ],
  },
  {
    code: "CL",
    name: "Chile",
    phoneCode: "+56",
    currency: "CLP",
    defaultTz: "America/Santiago",
    cities: [
      "Santiago",
      "Valparaíso",
      "Concepción",
      "La Serena",
      "Antofagasta",
      "Temuco",
      "Rancagua",
      "Talca",
      "Puerto Montt",
      "Punta Arenas",
    ],
  },
  {
    code: "CO",
    name: "Colombia",
    phoneCode: "+57",
    currency: "COP",
    defaultTz: "America/Bogota",
    cities: [
      "Bogotá",
      "Medellín",
      "Cali",
      "Barranquilla",
      "Cartagena",
      "Bucaramanga",
      "Santa Marta",
      "Pereira",
      "Manizales",
    ],
  },
  {
    code: "ES",
    name: "España",
    phoneCode: "+34",
    currency: "EUR",
    defaultTz: "Europe/Madrid",
    cities: [
      "Madrid",
      "Barcelona",
      "Valencia",
      "Sevilla",
      "Zaragoza",
      "Málaga",
      "Murcia",
      "Palma de Mallorca",
      "Bilbao",
      "Alicante",
      "Granada",
    ],
  },
  {
    code: "PE",
    name: "Perú",
    phoneCode: "+51",
    currency: "PEN",
    defaultTz: "America/Lima",
    cities: [
      "Lima",
      "Arequipa",
      "Trujillo",
      "Chiclayo",
      "Piura",
      "Cusco",
      "Huancayo",
      "Tacna",
    ],
  },
  {
    code: "PY",
    name: "Paraguay",
    phoneCode: "+595",
    currency: "PYG",
    defaultTz: "America/Asuncion",
    cities: [
      "Asunción",
      "Ciudad del Este",
      "San Lorenzo",
      "Luque",
      "Encarnación",
    ],
  },
  {
    code: "BO",
    name: "Bolivia",
    phoneCode: "+591",
    currency: "BOB",
    defaultTz: "America/La_Paz",
    cities: [
      "Santa Cruz de la Sierra",
      "La Paz",
      "Cochabamba",
      "Sucre",
      "Tarija",
      "Potosí",
    ],
  },
  {
    code: "EC",
    name: "Ecuador",
    phoneCode: "+593",
    currency: "USD",
    defaultTz: "America/Guayaquil",
    cities: [
      "Guayaquil",
      "Quito",
      "Cuenca",
      "Manta",
      "Ambato",
      "Loja",
    ],
  },
  {
    code: "US",
    name: "Estados Unidos",
    phoneCode: "+1",
    currency: "USD",
    defaultTz: "America/New_York",
    cities: [
      "Miami",
      "Nueva York",
      "Los Ángeles",
      "Chicago",
      "Houston",
      "San Antonio",
      "San Francisco",
    ],
  },
  {
    code: "OTHER",
    name: "Otro País / Internacional",
    phoneCode: "+1",
    currency: "USD",
    defaultTz: "UTC",
    cities: ["Sede Principal", "Central", "Comunidad 1", "Otra Ciudad"],
  },
]

export interface TimezoneItem {
  value: string
  label: string
  offsetMinutes: number
  offsetString: string
  region: string
}

export function getAllWorldTimezones(): TimezoneItem[] {
  let tzNames: string[] = []

  if (typeof Intl !== "undefined" && typeof (Intl as any).supportedValuesOf === "function") {
    try {
      tzNames = (Intl as any).supportedValuesOf("timeZone")
    } catch {
      tzNames = []
    }
  }

  if (!tzNames || tzNames.length === 0) {
    tzNames = [
      "UTC",
      "America/Montevideo",
      "America/Argentina/Buenos_Aires",
      "America/Argentina/Cordoba",
      "America/Santiago",
      "America/Sao_Paulo",
      "America/Asuncion",
      "America/La_Paz",
      "America/Lima",
      "America/Bogota",
      "America/Guayaquil",
      "America/Caracas",
      "America/Mexico_City",
      "America/Monterrey",
      "America/Cancun",
      "America/Guatemala",
      "America/Costa_Rica",
      "America/Panama",
      "America/Santo_Domingo",
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "Europe/Madrid",
      "Europe/London",
      "Europe/Paris",
      "Europe/Rome",
      "Europe/Lisbon",
    ]
  }

  const now = new Date()

  return tzNames
    .map((tz) => {
      try {
        const parts = new Intl.DateTimeFormat("es-UY", {
          timeZone: tz,
          timeZoneName: "shortOffset",
        }).formatToParts(now)
        const offsetPart = parts.find((p) => p.type === "timeZoneName")?.value || "GMT"

        let offsetMinutes = 0
        const match = offsetPart.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
        if (match) {
          const sign = match[1] === "+" ? 1 : -1
          const hours = parseInt(match[2], 10)
          const mins = match[3] ? parseInt(match[3], 10) : 0
          offsetMinutes = sign * (hours * 60 + mins)
        }

        const cleanName = tz.replace(/_/g, " ")
        const region = tz.split("/")[0] || "Global"

        return {
          value: tz,
          label: `(${offsetPart}) ${cleanName}`,
          offsetMinutes,
          offsetString: offsetPart,
          region,
        }
      } catch {
        return {
          value: tz,
          label: tz,
          offsetMinutes: 0,
          offsetString: "GMT",
          region: "Otros",
        }
      }
    })
    .sort((a, b) => {
      if (a.offsetMinutes !== b.offsetMinutes) {
        return a.offsetMinutes - b.offsetMinutes
      }
      return a.value.localeCompare(b.value)
    })
}
