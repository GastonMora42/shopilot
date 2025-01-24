"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/Button"
import { ChevronRight } from "lucide-react"
import React from "react"

type ContentBlock = 
  | { type: "text"; content: string }
  | { type: "heading"; level: 1 | 2 | 3; content: string }
  | { type: "image"; src: string; alt: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "blockquote"; content: string }

interface Article {
  id: string
  title: string
  description: string
  content: ContentBlock[]
  category: "guide" | "faq" | "blog"
  createdAt?: string // Opcional: para registrar la fecha de creación
  updatedAt?: string // Opcional: para registrar la última actualización
  tags?: string[]    // Opcional: para añadir etiquetas relacionadas al artículo
}

const articles: Article[] = [
    {
        "id": "1",
        "title": "Cómo crear un evento en ShowSpot",
        "description": "Guía paso a paso para crear tu primer evento",
        "content": [
          {
            "type": "text",
            "content": "Crear un evento en **ShowSpot** es un proceso sencillo y rápido que te permitirá gestionar diferentes tipos de eventos, desde conciertos y obras de teatro hasta fiestas y festivales. A continuación, te explicamos cómo hacerlo:"
          },
          {
            "type": "heading",
            "level": 2,
            "content": "1. Inicia sesión en tu cuenta"
          },
          {
            "type": "text",
            "content": "Para comenzar, asegúrate de haber iniciado sesión en tu cuenta de ShowSpot."
          },
          {
            "type": "heading",
            "level": 2,
            "content": "2. Accede a la sección de eventos"
          },
          {
            "type": "text",
            "content": "Dirígete a la sección **Eventos** en el menú principal. Una vez allí, haz clic en el botón **Crear Evento**."
          },
          {
            "type": "image",
            "src": "/evento.png",
            "alt": "Vista de la sección 'Crear Evento' en ShowSpot"
          },          
          {
            "type": "text",
            "content": "> **Tip:** Si tienes dudas sobre el diseño de asientos personalizados, consulta nuestra guía completa sobre cómo crear un [evento con asientos personalizados](#)."
          },
          {
            "type": "heading",
            "level": 2,
            "content": "3. Completa la información del evento"
          },
          {
            "type": "text",
            "content": "Se te pedirá que completes los detalles de tu evento:"
          },
          {
            "type": "list",
            "ordered": false,
            "items": [
              "**Nombre del evento**",
              "**Fecha y hora**",
              "**Ubicación**",
              "**Tipo de entradas:**",
              "[Entradas generales](#) (fiestas, festivales)",
              "[Entradas con asientos personalizados](#) (conciertos, obras de teatro)"
            ]
          },
          {
            "type": "text",
            "content": "Asegúrate de revisar cuidadosamente la información antes de avanzar."
          },
          {
            "type": "heading",
            "level": 2,
            "content": "4. Revisa y publica tu evento"
          },
          {
            "type": "text",
            "content": "Cuando todos los datos estén completos, realiza una última revisión para confirmar que todo esté correcto. Luego, haz clic en el botón **Publicar** para que tu evento esté visible y listo para recibir ventas. Si no estás seguro de cómo funciona la publicación, consulta nuestro artículo sobre [cómo publicar un evento](#)."
          },
          {
            "type": "text",
            "content": "**¡Eso es todo!** Ahora tu evento está configurado y listo para atraer a tus asistentes. Si necesitas ayuda adicional, revisa otras guías en nuestro blog o ponte en contacto con nuestro equipo de soporte."
          }
        ],
        "category": "guide"
      }, 

      {
        "id": "2",
        "title": "Eventos Generales",
        "description": "Crea eventos generales con entradas de diferentes tipos y precios",
        "content": [
          {
            "type": "text",
            "content": "Al crear un **evento general** estarás creando un evento para vender entradas de diferentes tipos y precios, con sus respectivos detalles. Por ejemplo, puedes tener entradas como 'Early Birds', 'Primera Tanda', 'Segunda Tanda', entre otras."
          },
          {
            "type": "text",
            "content": "Cada entrada tendrá su propio precio y detalles, y al comprar las entradas, el comprador recibirá un **QR individual** por cada entrada adquirida para asistir a tu evento."
          },
          {
            "type": "image",
            "src": "/generales.png",
            "alt": "Vista de un evento general en ShowSpot"
          },
          {
            "type": "text",
            "content": "> **Tip:** Puedes crear distintos tipos de entradas para organizar mejor la venta de boletos y asegurar la capacidad de tu evento."
          }
        ],
        "category": "guide"
      },      
      
      {
        "id": "3",
        "title": "Eventos con Asientos",
        "description": "Crea eventos con asientos personalizados para espectáculos, teatros y presentaciones",
        "content": [
          {
            "type": "text",
            "content": "Los **eventos con asientos** son ideales para espectáculos, teatros, presentaciones en vivo, cenas y otros tipos de eventos donde los asistentes necesitan un lugar específico para sentarse. En ShowSpot, puedes **crear mapas de asientos personalizados** para ofrecer una experiencia más organizada y atractiva a tus asistentes."
          },
          {
            "type": "text",
            "content": "Al crear un evento con asientos, podrás definir diferentes **secciones** dentro del espacio del evento, cada una con su propio valor y detalles. Puedes dibujar los asientos en la ubicación deseada dentro de la sección, y **dentro de una sección no se permiten espacios vacíos**. Si deseas crear un espacio vacío o dejar espacio entre secciones, deberás crear una nueva sección para organizar correctamente la disposición de los asientos."
          },
          {
            "type": "text",
            "content": "Es importante **guardar el mapa de asientos** antes de avanzar a la siguiente parte de la configuración del evento. Esto asegura que tu diseño se mantenga correctamente guardado para su posterior edición."
          },
          {
            "type": "text",
            "content": "Los asientos serán **numerados por filas y columnas** utilizando una combinación de letras y números, como 'G05', 'F07', 'A11', etc. Esta numeración te permitirá identificar fácilmente cada asiento dentro del mapa."
          },
          {
            "type": "image",
            "src": "/mapa.png",
            "alt": "Vista de un mapa de asientos personalizado en ShowSpot"
          },
          {
            "type": "text",
            "content": "> **Tip:** Utiliza las secciones para organizar áreas específicas, como zonas VIP o preferenciales. Esto te ayudará a optimizar la experiencia de tus asistentes."
          }
        ],
        "category": "guide"
      },

      {
        "id": "4",
        "title": "Publicar Evento en ShowSpot",
        "description": "Cómo hacer público tu evento y que los compradores puedan acceder",
        "content": [
          {
            "type": "text",
            "content": "Una vez tienes tu evento creado, **debes PUBLICARLO** para que tus compradores puedan acceder al link público del evento. Este link será de la siguiente forma: `https://www.showspot.xyz/e/mi-evento`."
          },
          {
            "type": "text",
            "content": "El nombre que hayas dado a tu evento (en este caso, 'mi evento') se utilizará para formar parte del link. Si el nombre tiene espacios, estos se reemplazarán por un guion ('-'). Si no tiene espacios, aparecerá tal cual."
          },
          {
            "type": "text",
            "content": "Para poder **publicar el evento** exitosamente, deberás tener **CREDITOS** disponibles en tu cuenta. Los créditos te permiten vender entradas y recibir el dinero instantáneamente en tu cuenta de MercadoPago. El equivalente es de 1 CREDITO = 1 Entrada."
          },
          {
            "type": "text",
            "content": "Por ejemplo, si creas un evento con capacidad para 500 entradas, necesitarás comprar 500 créditos en la ventana de créditos para poder publicarlo. ¡Tranquil@, son baratos! 😉"
          }
        ],
        "category": "guide"
      },
      
      {
        "id": "5",
        "title": "Créditos en ShowSpot",
        "description": "Explicación de cómo funcionan los créditos en ShowSpot",
        "content": [
          {
            "type": "text",
            "content": "**Créditos:** Los créditos son los equivalentes a las entradas cuando desees vender. Cada crédito te permitirá vender una entrada. Para comprar créditos, simplemente dirígete a la sección **'Créditos'** y selecciona la cantidad que desees comprar. Los créditos se acreditarán automáticamente en tu cuenta. ¡Es muy sencillo! 💳💸"
          },
          {
            "type": "text",
            "content": "Puedes comprar la cantidad que necesites desde la sección **Créditos** y recibirás los créditos al instante en tu cuenta. ¡Así de fácil! 😎"
          },
          {
            "type": "image",
            "src": "/creditos.png",
            "alt": "Vista de un mapa de asientos personalizado en ShowSpot"
          },
        ],
        "category": "guide"
      },
      
      {
        "id": "6",
        "title": "Cómo Recibir Pagos en ShowSpot",
        "description": "Pasos para configurar y recibir pagos a través de MercadoPago",
        "content": [
          {
            "type": "text",
            "content": "**Cómo cobrar - Pagos:** Para recibir pagos, simplemente configura tu cuenta de **MercadoPago** desde la sección de **Configuración** en tu perfil de ShowSpot. Allí podrás vincular tu cuenta de MercadoPago de manera automática."
          },
          {
            "type": "image",
            "src": "/config-mp.png",
            "alt": "Vista de un mapa de asientos personalizado en ShowSpot"
          },
          {
            "type": "text",
            "content": "Una vez vinculada tu cuenta, verás un estado exitoso en verde que dirá 'Cuenta de MercadoPago vinculada exitosamente'. A partir de ahí, recibirás el **total del valor de la entrada** que vendas, menos la comisión que se queda MercadoPago por utilizar su plataforma."
          },
          {
            "type": "text",
            "content": "IMPORTANTE: Esta comisión la podrás modificar directamente desde tu cuenta de MercadoPago, en la sección de **'Mi negocio'**. Ahí podrás configurar el porcentaje de comisión que MercadoPago te cobrará por el uso de su servicio."
          },
          {
            "type": "text",
            "content": "En la misma sección de **'Mi negocio'**, podrás seleccionar el **número de días** en los que deseas que se te acredite el dinero por las ventas. Esta configuración está asociada al porcentaje de comisión que MercadoPago cobra."
          },
          {
            "type": "text",
            "content": "También podrás configurar si deseas ofrecer **cuotas con tarjeta de crédito**. Para ello, simplemente ve a la sección de **'Mi negocio'** en tu cuenta de MercadoPago y activa las opciones que más te convengan. ¡Listo para ofrecer una mejor experiencia de compra!"
          }
        ],
        "category": "guide"
      },      
      
  
  // Add more articles as needed
]


const renderContent = (content: ContentBlock[]) => {
  return content.map((block, index) => {
    switch (block.type) {
      case "text":
        return (
          <p key={index}>
            {/* Procesar el texto para resaltar las negritas */}
            {block.content.split("**").map((text, i, arr) => {
              if (i % 2 === 1) {
                return <strong key={i}>{text}</strong>
              } else {
                return text
              }
            })}
          </p>
        )
      case "heading":
        return React.createElement(
          `h${block.level}`,
          { key: index },
          block.content
        )
      case "image":
        return (
          <img
            key={index}
            src={block.src}
            alt={block.alt}
            className="my-4 max-w-full h-auto"
          />
        )
      case "list":
        return (
          <ul key={index} className={block.ordered ? "list-decimal" : "list-none"}>
            {block.items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        )
      case "blockquote":
        return (
          <blockquote key={index} className="italic border-l-4 pl-4">
            {block.content}
          </blockquote>
        )
      default:
        return null
    }
  })
}

  
  export default function UserGuideAndBlog() {
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  
    return (
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Guía de Uso y Blog</h2>
          <Tabs defaultValue="guide" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="guide">Guía de Uso</TabsTrigger>
              <TabsTrigger value="faq">Preguntas Frecuentes</TabsTrigger>
              <TabsTrigger value="blog">Blog</TabsTrigger>
            </TabsList>
            {["guide", "faq", "blog"].map((category) => (
              <TabsContent key={category} value={category}>
                <div className="grid md:grid-cols-3 gap-8">
                  <Card className="md:col-span-1">
                    <CardHeader>
                      <CardTitle className="text-2xl">Artículos</CardTitle>
                      <br />
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px] pr-4">
                        {articles
                          .filter((article) => article.category === category)
                          .map((article) => (
                            <Button
                              key={article.id}
                              variant="ghost"
                              className="w-full justify-start mb-2 text-left"
                              onClick={() => setSelectedArticle(article)}
                            >
                              {article.title}
                              <ChevronRight className="ml-auto h-4 w-4" />
                            </Button>
                          ))}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-2xl">
                        {selectedArticle ? selectedArticle.title : "Selecciona un artículo"}
                      </CardTitle>
                      {selectedArticle && <CardDescription>{selectedArticle.description}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                    {selectedArticle ? (
  <div className="prose max-w-none">
    {selectedArticle.content?.map((block, index) => (
      <div key={index} className="prose max-w-none">
        {renderContent([block])} {/* Pasamos un bloque único al renderContent */}
      </div>
    ))}
  </div>
) : (
  <p className="text-gray-500">
    Por favor, selecciona un artículo de la lista para ver su contenido.
  </p>
)}

                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>
    );
  }
  