export const products = [
  {
    id: 1,
    name: 'MARINA',
    price: 15,
    public_price: '34,90',          
    category: 'Totebag',
    subcategory: 'Lino',
    type: 'tela',
    images: [
    ],

    swatches: [
      {
        name: 'Verde Agua', 
        css: '#7FB7A3',
        images: [
          '/images/MARINA/5.jpg',
        ]
      },
      { name: 'Verde Caqui',
        css: '#6B705C',
        images: [
          '/images/MARINA/4.jpg',
        ] 
      },
      { name: 'Beige', 
        css: '#D6CFC7',
        images: [
          '/images/MARINA/1.jpg',
          '/images/MARINA/2.jpg',
          '/images/MARINA/3.jpg',
        ]
      },
      { name: 'Morado', 
        css: '#6D597A',
        images: [
          '/images/MARINA/6.jpg',
          '/images/MARINA/7.jpeg',
        ]
       },

    ],

    description: [
      'Bolso de lino natural ligero, resistente y versàtil perfecto para la playa y como bolso shopper',
      'Confeccionado con lino natural , un tejido cómodo y elegante de alta durabilidad y gran capacidad',
      'Este bolso shopper es un accesorio de calidad y estilo para múltiples ocasiones: playa, compras, fin de semana'
    ],

    composition: {
      exterior: 'lino lavado natural 230gm2, * OEKO-TEX® 100 certified',
      interior: 'algodón 100%'
    },

    care: [
      'Lavar en agua fría',
      'No usar secadora'
    ],

     details: {
      measures: '37 x 32 x 17 cm',
      handles: 'Asas de algodón 100% espigado'
    }
    
  },

  {
    id: 2,
    name: 'NAUTIC',
    price: 15,
    public_price: '34,90',           
    category: 'Maxi ToteBag',
    subcategory: 'Lino',
    type: 'tela',
    images: [
      '/images/NAUTIC/2.jpg',
      '/images/bolso_granate/bolso_granate.jpg',
      '/images/NAUTIC/1.jpg',
    ],

    swatches: [

    ],

    description: [
      'TOTEBAG de lino natural ligero, resistente y versàtil perfecto para la playa y como bolso shopper',
      'Confeccionado con lino natural , un tejido cómodo y elegante de alta durabilidad',
      'Este bolso, de gran capacidad  y cierre con cremallera es un accesorio de calidad y estilo para múltiples ocasiones'
    ],

    composition: {
      exterior: 'lino lavado natural 230gm2, * OEKO-TEX® 100 certified',
      interior: 'algodón 100%'
    },

    care: [
      'Lavar en agua fría',
      'No usar secadora'
    ],

     details: {
      measures: '54 x 44 x 7 cm',
      handles: 'Asas de algodón 100% espigado'
    }
    
  },

  {
    id: 3,
    name: 'HEURA',
    price: 13,
    public_price: '28,60',           
    category: 'ToteBag',
    subcategory: 'Lino',
    type: 'tela',
    images: [
    ],
    swatches: [
      { name: 'Beige',
        css: '#D6CFC7',
        images: [
          '/images/HEURA/6.jpg',
          '/images/HEURA/3.jpg',
          '/images/HEURA/2.jpg',
        ]
      },
      { name: 'Azul marino', 
        css: '#2B3A6B',
        images: [
          '/images/HEURA/8.jpg',
          '/images/HEURA/7.jpg',
          '/images/HEURA/heura.jpeg',
        ]
      },
    ],

    description: [
      'Bolso de lino natural de diseño minimalista, perfecto para acompañarte en tu día a día.',
      'Su textura ligera lo convierten en un complemento versátil y atemporal, ideal para cualquier ocasión.',
      'Cuenta con un asa amplia y cómoda que se adapta al hombro, ofreciendo practicidad sin renunciar al estilo.',
      'Su forma suave y espaciosa permite llevar todo lo esencial con facilidad, mientras que el cierre superior aporta seguridad y funcionalidad'
    ],

    composition: {
      exterior: 'lino lavado natural 230gm2, * OEKO-TEX® 100 certified',
      interior: 'algodón 100%'
    },

    care: [
      'Lavar en agua fría',
      'No usar secadora'
    ],

     details: {
      measures: '45 x 26 cm',
      handles: 'Asa media lateral: de 54x5 /  Asa larga para cruzar: 71x5'
    }
    
  },

  {
    id: 4,
    name: 'MINI HEURA',
    price: 13,
    public_price: '28,60',           
    category: 'ToteBag',
    subcategory: 'Lino',
    type: 'tela',
    images: [
      '/images/MINI_HEURA/2.jpg',
      '/images/MINI_HEURA/1.jpg',
      '/images/MINI_HEURA/3.jpg',
      '/images/MINI_HEURA/mini_heura.jpeg'
    ],

    swatches: [

    ],

    description: [
      'Bolso de lino ligero y práctico, perfecto para el uso diario.',
      'Su diseño sencillo y elegante lo convierte en el complemento perfecto para tu día a día.',
      'Un básico con estilo que eleva cualquier look.'
    ],

    composition: {
      exterior: 'lino natural, * OEKO-TEX® 100 certified',
      interior: 'algodón 100%'
    },

    care: [
      'Lavar en agua fría',
      'No usar secadora'
    ],

     details: {
      measures: '38 x 15 x 5 cm',
      handles: 'Asa de 48 x 5'
    }
    
  },

  {
    id: 5,
    name: 'MAREA PIEL SERRAJE',
    color: 'Camel',
    price: 25,
    public_price: 55,           
    category: 'Ante pequeño',
    subcategory: 'Artesanal',
    type: 'piel',
    images: [
      '/images/BOLSO_PIEL/5.jpeg',
      '/images/BOLSO_PIEL/6.jpeg',
      '/images/BOLSO_PIEL/IMG_4927.jpeg',
    ],

    swatches: [
      
    ],

    description: [
      'Bolso de ante en tono camel, suave, elegante y sofisticado.',
      'Su textura cálida y diseño minimalista lo convierten en el complemento perfecto para un look sofisticado y versátil',
      'Cuenta con un cierre de cremallera metálica'
    ],

    composition: {
      exterior: 'Piel de ante',
      interior: 'algodón 100%'
    },

    care: [
      
    ],

     details: {
      measures: '38 x 17 x 6 cm',
      handles: 'Asa de 42 x 5'
    }
    
  },

  {
    id: 6,
    name: 'MAREA PIEL ROJO',
    color: 'Rojo',
    price: 33,
    public_price: 72,           
    category: 'Ante pequeño',
    subcategory: 'Artesanal',
    type: 'piel',
    images: [
      '/images/BOLSO_PIEL/marea.jpeg',
      '/images/BOLSO_PIEL/mares.jpeg'
    ],
    
    swatches: [
      
    ],

    description: [
      'Bolso de piel rojo, suave, elegante y sofisticado.',
      'Su textura cálida y diseño minimalista lo convierten en el complemento perfecto para un look sofisticado y versátil',
      'Cuenta con un cierre de cremallera metálica'
    ],

    composition: {
      exterior: 'Piel de ante',
      interior: 'algodón 100%'
    },

    
    care: [
      
    ],
    

     details: {
      measures: '38 x 17 x 6 cm',
      handles: 'Asa de 42 x 5'
    }
    
  },

  {
    id: 7,
    name: 'MENORCA',
    price: 8,
    public_price: '17,60',           
    category: 'ToteBag',
    subcategory: 'Lino',
    type: 'tela',
    images: [
      '/images/MENORCA/1.jpeg'
    ],

    swatches: [

    ],

    description: [
      'Bolso de lino ligero y práctico, perfecto para el uso diario.',
      'Su diseño sencillo y elegante lo convierte en el complemento perfecto para tu día a día.',
      'Un básico con estilo que eleva cualquier look.'
    ],

    composition: {
      exterior: 'lino natural, * OEKO-TEX® 100 certified',
      interior: 'algodón 100%'
    },

    care: [
      'Lavar en agua fría',
      'No usar secadora'
    ],

     details: {
      measures: '38 x 15 x 5 cm',
      handles: 'Asa de 48 x 5'
    }
    
  },

  {
    id: 8,
    name: 'BASI',
    price: 6,
    public_price: 13,           
    category: 'ToteBag',
    subcategory: 'Lino',
    type: 'tela',
    images: [
      '/images/BASI/1.jpeg',
      '/images/BASI/2.jpeg'
    ],

    swatches: [

    ],

    description: [
      'Bolso de lino ligero y práctico, perfecto para el uso diario.',
      'Su diseño sencillo y elegante lo convierte en el complemento perfecto para tu día a día.',
      'Un básico con estilo que eleva cualquier look.'
    ],

    composition: {
      exterior: 'lino natural, * OEKO-TEX® 100 certified',
      interior: 'algodón 100%'
    },

    care: [
      'Lavar en agua fría',
      'No usar secadora'
    ],

     details: {
      measures: '38 x 15 x 5 cm',
      handles: 'Asa de 48 x 5'
    }
    
  },
  
]


export const carouselImages = [
  '/images/bolso_celeste/bolso_celeste_modelo.jpg',
  '/images/bolso_beige/bolso_beige_modelo_2.jpg',
  '/images/mini_bolso_azul/mini_bolso_azul_modelo.jpg',
  '/images/bolso_granate/bolso_granate_modelo.jpg',
  '/images/bolso_beige/bolso_beige_modelo.jpg',
  
]