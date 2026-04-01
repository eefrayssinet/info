export const MODELS = [
  {
    id: "grid-01",
    name: "GRID-01",
    label: "precision",
    description: "Ordena mejor respuestas tecnicas, estructuras y formatos estrictos.",
  },
  {
    id: "pulse-02",
    name: "PULSE-02",
    label: "creative",
    description: "Rinde mejor en direccion creativa, conceptos y sinteticos expresivos.",
  },
  {
    id: "echo-03",
    name: "ECHO-03",
    label: "balanced",
    description: "Equilibrado entre claridad, sintesis y lenguaje de negocios.",
  },
];

export const TRACKS = [
  {
    id: "code-grid",
    name: "Code Grid",
    mode: "grid",
    accent: "cyan",
    summary: "Debugging, APIs, JSON estricto y decisiones de estructura.",
    crowdLine: "La cabina de programacion castiga cada palabra extra.",
    holes: [
      {
        id: "code-grid-01",
        number: 1,
        title: "JSON estable",
        par: 4,
        difficulty: "warmup",
        objective:
          "Conseguir que el modelo devuelva solo un JSON valido con las claves bug, fix, risk y test.",
        intro:
          "Tu equipo necesita una respuesta directamente procesable por una API interna. No hay tolerancia para texto alrededor del JSON.",
        constraints: [
          "Solo JSON valido",
          "Claves obligatorias: bug, fix, risk, test",
          "Sin texto extra antes ni despues",
        ],
        judgeCriteria: [
          "Parsea como JSON",
          "Incluye las 4 claves requeridas",
          "No agrega explicaciones fuera del objeto",
        ],
        promptTips: [
          "pedi formato estricto",
          "nombrá todas las claves",
          "recordale que no agregue texto extra",
        ],
        type: "json",
        requiredPromptTerms: ["json", "bug", "fix", "risk", "test"],
        structurePromptTerms: ["solo", "estricto", "sin texto", "valido"],
        preferredModels: ["grid-01", "echo-03"],
        successOutput: {
          bug: "El endpoint mezcla errores de validacion con fallos internos en el mismo campo message.",
          fix: "Separar validationError de serverError y devolver status codes consistentes.",
          risk: "Si no se corrige, clientes externos rompen el parseo y muestran errores ambiguos.",
          test: "Agregar test de contrato para 400 y 500 con snapshots del payload JSON.",
        },
        partialOutput: {
          bug: "El endpoint no discrimina bien los errores.",
          fix: "Separar errores de validacion y errores internos.",
          test: "Agregar un test de contrato para validar el payload.",
        },
        failOutput:
          "Podrias responder con una explicacion general del bug y despues convertirla a JSON si hace falta.",
      },
      {
        id: "code-grid-02",
        number: 2,
        title: "Patch plan",
        par: 5,
        difficulty: "core",
        objective:
          "Obtener un plan de parche con las secciones Contexto, Cambio, Test y Rollback.",
        intro:
          "El equipo de release necesita un instructivo compacto para parchear produccion sin improvisar.",
        constraints: [
          "Usar exactamente cuatro secciones",
          "Mantener foco tecnico",
          "No mezclar rollback con testing",
        ],
        judgeCriteria: [
          "Tiene las cuatro secciones requeridas",
          "Cada seccion es accionable",
          "El bloque de test incluye una verificacion concreta",
        ],
        promptTips: [
          "pedi headings exactos",
          "separa implementacion de rollback",
          "evita prosa vaga",
        ],
        type: "sections",
        requiredPromptTerms: ["contexto", "cambio", "test", "rollback"],
        structurePromptTerms: ["secciones", "exactas", "accionable"],
        preferredModels: ["grid-01", "echo-03"],
        sections: [
          {
            heading: "Contexto",
            body:
              "El bug aparece cuando el endpoint serializa errores de negocio y de sistema con la misma estructura.",
          },
          {
            heading: "Cambio",
            body:
              "Separar los mappers de error, unificar status codes y documentar el contrato esperado por clientes.",
          },
          {
            heading: "Test",
            body:
              "Agregar test para 400, 404 y 500, mas una prueba de snapshot del payload final.",
          },
          {
            heading: "Rollback",
            body:
              "Mantener la version anterior del serializer y revertir el feature flag si aparece un error de parseo.",
          },
        ],
      },
    ],
  },
  {
    id: "studio-pulse",
    name: "Studio Pulse",
    mode: "amber",
    accent: "amber",
    summary: "Direccion creativa, sistemas visuales y prompts de diseno.",
    crowdLine: "La pista de diseno premia claridad visual con pocos tiros.",
    holes: [
      {
        id: "studio-pulse-01",
        number: 1,
        title: "Hero mobile-first",
        par: 4,
        difficulty: "warmup",
        objective:
          "Conseguir una salida con Concepto, Principios y CTA para un hero mobile-first.",
        intro:
          "Necesitas una respuesta lista para bajar a Figma: idea central, 3 principios y un CTA claro.",
        constraints: [
          "Incluir exactamente 3 principios",
          "Pensar primero en mobile",
          "Cerrar con un CTA unico",
        ],
        judgeCriteria: [
          "Tiene Concepto, Principios y CTA",
          "La seccion Principios tiene tres bullets",
          "La respuesta se siente usable, no abstracta",
        ],
        promptTips: [
          "pedi 3 principios exactos",
          "menciona mobile-first",
          "pedi un solo CTA",
        ],
        type: "sections-list",
        requiredPromptTerms: ["mobile", "concepto", "principios", "cta"],
        structurePromptTerms: ["3", "bullets", "hero"],
        preferredModels: ["pulse-02", "echo-03"],
        sections: [
          {
            heading: "Concepto",
            body:
              "Una interfaz que se abre como un panel de energia: directa, luminosa y pensada para pulgares.",
          },
          {
            heading: "Principios",
            bullets: [
              "Jerarquia inmediata con un solo foco dominante.",
              "Bloques cortos y respirados para lectura rapida en pantalla pequena.",
              "Accion principal siempre visible sin depender del scroll.",
            ],
            minItems: 3,
          },
          {
            heading: "CTA",
            body: "Reservar acceso al circuito",
          },
        ],
      },
      {
        id: "studio-pulse-02",
        number: 2,
        title: "Sistema express",
        par: 5,
        difficulty: "core",
        objective:
          "Generar una respuesta con las secciones Sistema, Componentes, Motion y Copy.",
        intro:
          "El estudio necesita una mini direccion de sistema lista para pasar a diseño y desarrollo.",
        constraints: [
          "Separar sistema de componentes",
          "No usar mas de una idea de motion",
          "Mantener tono de marca consistente",
        ],
        judgeCriteria: [
          "Tiene las cuatro secciones",
          "Los componentes son concretos",
          "Motion y copy no se pisan entre si",
        ],
        promptTips: [
          "usa headings exactos",
          "pedi componentes concretos",
          "evita generalidades visuales",
        ],
        type: "sections",
        requiredPromptTerms: ["sistema", "componentes", "motion", "copy"],
        structurePromptTerms: ["headings", "exactos", "consistente"],
        preferredModels: ["pulse-02", "echo-03"],
        sections: [
          {
            heading: "Sistema",
            body:
              "Base oscura, brillo cian para estructura y ambar para accion principal y niveles de logro.",
          },
          {
            heading: "Componentes",
            body:
              "Hero, score panel, chips de estado, cards de circuito y CTA flotante.",
          },
          {
            heading: "Motion",
            body:
              "Un barrido corto de scanning al entrar y una unica transicion de glow en el CTA principal.",
          },
          {
            heading: "Copy",
            body:
              "Directo, energico y performatico, sin tecnicismos innecesarios ni frases blandas.",
          },
        ],
      },
    ],
  },
  {
    id: "structure-loop",
    name: "Structure Loop",
    mode: "grid",
    accent: "cyan",
    summary: "Programa, circulacion, materialidad y pensamiento espacial.",
    crowdLine: "Cada hoyo de arquitectura pide contexto y forma en equilibrio.",
    holes: [
      {
        id: "structure-loop-01",
        number: 1,
        title: "Taller 40m2",
        par: 4,
        difficulty: "warmup",
        objective:
          "Armar una respuesta con Zonas, Circulacion y Materialidad para un taller de 40m2.",
        intro:
          "La consigna pide una distribucion rapida pero viable, con lectura espacial clara.",
        constraints: [
          "Separar programa y movimiento",
          "No olvidar materialidad",
          "Escala compacta",
        ],
        judgeCriteria: [
          "Estan las tres secciones",
          "Las zonas son concretas",
          "Circulacion y materialidad son legibles",
        ],
        promptTips: [
          "nombrá los tres headings",
          "menciona 40m2",
          "pedi una solucion compacta",
        ],
        type: "sections",
        requiredPromptTerms: ["zonas", "circulacion", "materialidad"],
        structurePromptTerms: ["40m2", "taller", "compacta"],
        preferredModels: ["echo-03", "grid-01"],
        sections: [
          {
            heading: "Zonas",
            body:
              "Frente de recepcion y exhibicion, nucleo de trabajo central y franja posterior para guardado y limpieza.",
          },
          {
            heading: "Circulacion",
            body:
              "Recorrido lineal corto con acceso frontal y una vuelta limpia alrededor del banco principal.",
          },
          {
            heading: "Materialidad",
            body:
              "Piso continuo resistente, tableros modulares en madera y metal pintado para estructura liviana.",
          },
        ],
      },
      {
        id: "structure-loop-02",
        number: 2,
        title: "Stand modular",
        par: 5,
        difficulty: "core",
        objective:
          "Obtener Modulo, Ensamblaje, Flujo y Riesgo para un stand transportable.",
        intro:
          "Necesitas una solucion armable, facil de mover y que no colapse al montarse en feria.",
        constraints: [
          "Pensar transporte y armado",
          "Separar riesgo de flujo",
          "Mantener lenguaje tecnico claro",
        ],
        judgeCriteria: [
          "Tiene las cuatro secciones",
          "Modulo y ensamblaje se entienden",
          "El riesgo es especifico",
        ],
        promptTips: [
          "headings exactos",
          "menciona stand transportable",
          "pedi un riesgo concreto",
        ],
        type: "sections",
        requiredPromptTerms: ["modulo", "ensamblaje", "flujo", "riesgo"],
        structurePromptTerms: ["stand", "transportable", "feria"],
        preferredModels: ["echo-03", "grid-01"],
        sections: [
          {
            heading: "Modulo",
            body:
              "Paneles repetibles de 1m x 2m con uniones ocultas y base estabilizada.",
          },
          {
            heading: "Ensamblaje",
            body:
              "Sistema de encastre y traba rapida que reduce herramientas y acelera armado.",
          },
          {
            heading: "Flujo",
            body:
              "Ingreso frontal abierto, pieza demostrativa al centro y salida lateral sin cruces.",
          },
          {
            heading: "Riesgo",
            body:
              "La union superior puede torsionarse si el panel no llega nivelado, por eso conviene sumar guia de ajuste.",
          },
        ],
      },
    ],
  },
  {
    id: "legal-echo",
    name: "Legal Echo",
    mode: "violet",
    accent: "violet",
    summary: "Contratos, compliance y claridad juridica.",
    crowdLine: "La pista legal detecta ambiguedad y castiga exceso ornamental.",
    holes: [
      {
        id: "legal-echo-01",
        number: 1,
        title: "Clausula de responsabilidad",
        par: 4,
        difficulty: "warmup",
        objective:
          "Conseguir Riesgo detectado, Clausula propuesta y Nota para un contrato SaaS.",
        intro:
          "La empresa quiere bajar riesgo sin volver la clausula incomprensible para el cliente.",
        constraints: [
          "Separar analisis de redaccion",
          "No usar latin innecesario",
          "Mantener tono contractual",
        ],
        judgeCriteria: [
          "Tiene las tres secciones",
          "La clausula propuesta esta redactada",
          "La nota explica el cambio en lenguaje claro",
        ],
        promptTips: [
          "pedi secciones exactas",
          "menciona contrato SaaS",
          "evita jerga excesiva",
        ],
        type: "sections",
        requiredPromptTerms: ["riesgo", "clausula", "nota"],
        structurePromptTerms: ["contrato", "saas", "claro"],
        preferredModels: ["grid-01", "echo-03"],
        sections: [
          {
            heading: "Riesgo detectado",
            body:
              "La version actual asume responsabilidad amplia incluso por usos fuera del control razonable del proveedor.",
          },
          {
            heading: "Clausula propuesta",
            body:
              "La responsabilidad del proveedor se limita a danos directos previsibles derivados de incumplimiento comprobado y hasta el monto efectivamente pagado en los ultimos doce meses.",
          },
          {
            heading: "Nota",
            body:
              "La nueva redaccion reduce exposicion abierta, mantiene equilibrio comercial y sigue siendo entendible para clientes no tecnicos.",
          },
        ],
      },
      {
        id: "legal-echo-02",
        number: 2,
        title: "Uso de datos",
        par: 5,
        difficulty: "core",
        objective:
          "Pedir Obligaciones, Limites y Version amigable para una politica de datos.",
        intro:
          "La marca quiere una politica robusta, pero tambien una explicacion amigable para onboarding.",
        constraints: [
          "Separar legal estricto de version amigable",
          "No omitir limites de uso",
          "Mantener coherencia",
        ],
        judgeCriteria: [
          "Tiene las tres secciones",
          "Obligaciones y limites son distintas",
          "La version amigable resume sin perder sentido",
        ],
        promptTips: [
          "nombra las secciones",
          "pedi resumen claro",
          "aclara politica de datos",
        ],
        type: "sections",
        requiredPromptTerms: ["obligaciones", "limites", "version amigable"],
        structurePromptTerms: ["datos", "politica", "resumen"],
        preferredModels: ["echo-03", "grid-01"],
        sections: [
          {
            heading: "Obligaciones",
            body:
              "Informar finalidades, bases de tratamiento, plazos de conservacion y mecanismos de ejercicio de derechos.",
          },
          {
            heading: "Limites",
            body:
              "No usar datos para finalidades no informadas ni compartirlos con terceros sin base valida o consentimiento correspondiente.",
          },
          {
            heading: "Version amigable",
            body:
              "Te contamos que datos usamos, por que los usamos, cuanto tiempo los guardamos y como podes pedir cambios o borrado.",
          },
        ],
      },
    ],
  },
  {
    id: "market-run",
    name: "Market Run",
    mode: "amber",
    accent: "amber",
    summary: "Pricing, segmentacion y estrategia de salida.",
    crowdLine: "La pista de negocios recompensa foco y estructura comercial.",
    holes: [
      {
        id: "market-run-01",
        number: 1,
        title: "Pricing ladder",
        par: 4,
        difficulty: "warmup",
        objective:
          "Obtener Segmento, Tiers y Metrica para una herramienta B2B liviana.",
        intro:
          "El producto sale a mercado y necesita una escalera de precios clara con una metrica central.",
        constraints: [
          "Tres tiers concretos",
          "Segmento antes de precio",
          "Una metrica principal",
        ],
        judgeCriteria: [
          "Tiene Segmento, Tiers y Metrica",
          "La seccion Tiers incluye tres bullets",
          "La metrica es medible",
        ],
        promptTips: [
          "pedi 3 tiers",
          "inclui segmento objetivo",
          "defini una metrica principal",
        ],
        type: "sections-list",
        requiredPromptTerms: ["segmento", "tiers", "metrica"],
        structurePromptTerms: ["3", "precios", "b2b"],
        preferredModels: ["echo-03", "pulse-02"],
        sections: [
          {
            heading: "Segmento",
            body:
              "Equipos pequenos de producto y operaciones que necesitan coordinar entregas sin una suite pesada.",
          },
          {
            heading: "Tiers",
            bullets: [
              "Starter: para equipos de hasta 5 personas con funciones basicas.",
              "Growth: para equipos de 6 a 20 personas con automatizaciones y paneles.",
              "Scale: para operaciones grandes con control, permisos y soporte dedicado.",
            ],
            minItems: 3,
          },
          {
            heading: "Metrica",
            body: "Activacion semanal de equipos con al menos un flujo completado.",
          },
        ],
      },
      {
        id: "market-run-02",
        number: 2,
        title: "Launch brief",
        par: 5,
        difficulty: "core",
        objective:
          "Armar Segmento, Oferta, Canal y Metrica para un lanzamiento rapido.",
        intro:
          "Hay que salir en poco tiempo sin quemar presupuesto, pero con una narrativa comercial creible.",
        constraints: [
          "Un segmento principal",
          "Una oferta clara",
          "Canal y metrica separados",
        ],
        judgeCriteria: [
          "Tiene las cuatro secciones",
          "La oferta no es vaga",
          "Canal y metrica son concretos",
        ],
        promptTips: [
          "usa headings exactos",
          "pedi foco comercial",
          "separa acquisition y metricas",
        ],
        type: "sections",
        requiredPromptTerms: ["segmento", "oferta", "canal", "metrica"],
        structurePromptTerms: ["lanzamiento", "rapido", "claro"],
        preferredModels: ["echo-03", "pulse-02"],
        sections: [
          {
            heading: "Segmento",
            body:
              "Estudios de diseno y consultoras pequenas que necesitan acelerar propuesta y presentacion.",
          },
          {
            heading: "Oferta",
            body:
              "Resolver propuesta, presentacion y primera validacion comercial en una sola herramienta.",
          },
          {
            heading: "Canal",
            body:
              "Outbound liviano a estudios target + demos cortas compartidas por partners de comunidad.",
          },
          {
            heading: "Metrica",
            body:
              "Cantidad de demos agendadas que pasan a prueba real dentro de los primeros 7 dias.",
          },
        ],
      },
    ],
  },
  {
    id: "thesis-void",
    name: "Thesis Void",
    mode: "violet",
    accent: "violet",
    summary: "Logica, tesis, objeciones y sintesis argumental.",
    crowdLine: "La pista filosofica mide claridad bajo presion conceptual.",
    holes: [
      {
        id: "thesis-void-01",
        number: 1,
        title: "Compresion de tesis",
        par: 4,
        difficulty: "warmup",
        objective: "Obtener Tesis, Objecion y Respuesta en una sola salida.",
        intro:
          "El reto es bajar una idea compleja a una forma argumental minima, defendible y elegante.",
        constraints: [
          "Usar exactamente tres secciones",
          "Evitar lenguaje innecesariamente barroco",
          "La respuesta debe enfrentar la objecion",
        ],
        judgeCriteria: [
          "Tiene Tesis, Objecion y Respuesta",
          "La objecion contradice de verdad",
          "La respuesta no evade el conflicto",
        ],
        promptTips: [
          "pedi una estructura minima",
          "nombra las tres secciones",
          "enfatiza claridad",
        ],
        type: "sections",
        requiredPromptTerms: ["tesis", "objecion", "respuesta"],
        structurePromptTerms: ["clara", "estructura", "minima"],
        preferredModels: ["pulse-02", "echo-03"],
        sections: [
          {
            heading: "Tesis",
            body:
              "La IA no reemplaza criterio proyectual; redistribuye donde ese criterio se vuelve decisivo.",
          },
          {
            heading: "Objecion",
            body:
              "Si la generacion automatica cubre cada vez mas tareas, el margen para decidir podria volverse simbolico y no real.",
          },
          {
            heading: "Respuesta",
            body:
              "Justamente por eso el valor se desplaza a formular problemas, validar resultados y sostener responsabilidad donde la maquina solo propone.",
          },
        ],
      },
      {
        id: "thesis-void-02",
        number: 2,
        title: "Trade-off etico",
        par: 5,
        difficulty: "core",
        objective:
          "Pedir Posicion, Tension y Sintesis sobre un dilema etico de automatizacion.",
        intro:
          "No alcanza con una opinion. Hace falta una posicion, una tension real y una salida integradora.",
        constraints: [
          "Posicion definida",
          "Tension autentica",
          "Sintesis que no sea escapista",
        ],
        judgeCriteria: [
          "Tiene las tres secciones",
          "La tension no es decorativa",
          "La sintesis integra ambas fuerzas",
        ],
        promptTips: [
          "usa headings exactos",
          "pedi un dilema real",
          "evita cierre blando",
        ],
        type: "sections",
        requiredPromptTerms: ["posicion", "tension", "sintesis"],
        structurePromptTerms: ["etico", "dilema", "automatizacion"],
        preferredModels: ["pulse-02", "echo-03"],
        sections: [
          {
            heading: "Posicion",
            body:
              "Automatizar decisiones repetitivas puede liberar tiempo humano para tareas de mayor responsabilidad.",
          },
          {
            heading: "Tension",
            body:
              "Si la automatizacion tambien oculta criterios y desplaza rendicion de cuentas, la eficiencia puede comprar opacidad.",
          },
          {
            heading: "Sintesis",
            body:
              "Automatizar solo es defendible cuando cada decision relevante puede auditarse, discutirse y revertirse por humanos responsables.",
          },
        ],
      },
    ],
  },
];

export const SAMPLE_LEADERBOARD = [
  { handle: "NEONKAPI", holeId: "code-grid-01", promptsUsed: 3, scoreVsPar: -1 },
  { handle: "ARC-LAB", holeId: "code-grid-02", promptsUsed: 4, scoreVsPar: -1 },
  { handle: "SYNTHFORM", holeId: "studio-pulse-01", promptsUsed: 4, scoreVsPar: 0 },
  { handle: "VOIDCLAUSE", holeId: "legal-echo-01", promptsUsed: 3, scoreVsPar: -1 },
  { handle: "MKTLOOP", holeId: "market-run-01", promptsUsed: 4, scoreVsPar: 0 },
  { handle: "THESISCTRL", holeId: "thesis-void-01", promptsUsed: 3, scoreVsPar: -1 },
];
