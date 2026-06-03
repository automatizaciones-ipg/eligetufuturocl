import React from 'react';
import { ShieldCheck, FileText, Lock, UserCheck } from 'lucide-react';

export default function TerminosYCondiciones() {
  const ultimaActualizacion = "3 de Junio de 2026";

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 font-sans text-gray-800">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-[#1A1528] to-[#2D2442] px-8 py-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-3">
            Términos, Condiciones y <br className="hidden md:block" />
            Políticas de Privacidad
          </h1>
          <p className="text-gray-300 font-medium tracking-wide">
            Eligetufuturo — Última actualización: {ultimaActualizacion}
          </p>
        </div>

        {/* Contenido Legal */}
        <div className="p-8 md:p-12 space-y-10 text-gray-600 leading-relaxed">
          
          <section>
            <h2 className="flex items-center gap-2 text-xl font-bold text-[#1A1528] mb-4 uppercase tracking-wide border-b border-gray-100 pb-2">
              <FileText className="w-5 h-5 text-[#6544FF]" />
              1. Aceptación de los Términos
            </h2>
            <p>
              Al acceder, navegar o utilizar cualquier servicio, función o formulario dentro de la plataforma <strong>Eligetufuturo</strong>, usted acepta expresamente estar sujeto a estos Términos y Condiciones, así como a nuestra Política de Privacidad. Si no está de acuerdo con alguna parte de estos términos, le solicitamos que se abstenga de utilizar nuestros servicios.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-xl font-bold text-[#1A1528] mb-4 uppercase tracking-wide border-b border-gray-100 pb-2">
              <Lock className="w-5 h-5 text-[#6544FF]" />
              2. Marco Legal y Cumplimiento
            </h2>
            <p>
              El tratamiento de los datos personales en <strong>Eligetufuturo</strong> se rige estrictamente por las leyes de la República de Chile, en particular por la <strong>Ley N° 19.628 sobre Protección de la Vida Privada</strong> (y sus futuras modificaciones). Nos comprometemos a garantizar la seguridad, confidencialidad y el correcto procesamiento de la información de nuestros usuarios.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-xl font-bold text-[#1A1528] mb-4 uppercase tracking-wide border-b border-gray-100 pb-2">
              <UserCheck className="w-5 h-5 text-[#6544FF]" />
              3. Recopilación y Finalidad del Tratamiento de Datos
            </h2>
            <p className="mb-4">
              Los datos personales ingresados libre y voluntariamente por los usuarios en nuestros formularios serán tratados con las siguientes finalidades:
            </p>
            <ul className="space-y-3 pl-2">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6544FF] mt-2 flex-shrink-0"></span>
                <span><strong>Uso Interno y Operativo:</strong> Para gestionar las consultas, mejorar la experiencia de usuario, optimizar nuestros servicios y personalizar la información orientacional entregada.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6544FF] mt-2 flex-shrink-0"></span>
                <span><strong>Comunicaciones y Publicidad:</strong> Para enviar información relevante, boletines, noticias de interés, ofertas educativas y material publicitario relacionado estrictamente con el rubro de <strong>Eligetufuturo</strong>.</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-xl font-bold text-[#1A1528] mb-4 uppercase tracking-wide border-b border-gray-100 pb-2">
              <ShieldCheck className="w-5 h-5 text-[#6544FF]" />
              4. Protección y No Comercialización de Datos
            </h2>
            <p>
              En <strong>Eligetufuturo</strong> valoramos su privacidad. Garantizamos categóricamente que <strong>no venderemos, arrendaremos, cederemos ni lucraremos</strong> con sus datos personales entregándolos a terceros ajenos a nuestra operativa. Su información se mantiene en bases de datos seguras, con acceso restringido y protocolos de seguridad informática para evitar alteraciones, pérdidas o accesos no autorizados.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-xl font-bold text-[#1A1528] mb-4 uppercase tracking-wide border-b border-gray-100 pb-2">
              <UserCheck className="w-5 h-5 text-[#6544FF]" />
              5. Derechos del Usuario (Derechos ARCO)
            </h2>
            <p className="mb-4">
              En conformidad con la legislación chilena, todo usuario titular de los datos personales tiene derecho a:
            </p>
            <ul className="space-y-3 pl-2">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6544FF] mt-2 flex-shrink-0"></span>
                <span><strong>Acceso:</strong> Solicitar información sobre los datos propios que almacenamos.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6544FF] mt-2 flex-shrink-0"></span>
                <span><strong>Rectificación:</strong> Exigir la corrección de datos erróneos, inexactos o desactualizados.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6544FF] mt-2 flex-shrink-0"></span>
                <span><strong>Cancelación:</strong> Solicitar la eliminación total de sus datos de nuestros registros y listas de envío (darse de baja).</span>
              </li>
            </ul>
            <p className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm">
              Para ejercer cualquiera de estos derechos, el usuario puede comunicarse con nosotros en cualquier momento a través del correo electrónico oficial proporcionado en la plataforma.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-xl font-bold text-[#1A1528] mb-4 uppercase tracking-wide border-b border-gray-100 pb-2">
              <FileText className="w-5 h-5 text-[#6544FF]" />
              6. Modificaciones a los Términos
            </h2>
            <p>
              Nos reservamos el derecho de modificar esta Política de Privacidad en cualquier momento para adaptarla a novedades legislativas, jurisprudenciales o prácticas de la industria. Cualquier cambio sustancial será notificado oportunamente en nuestra plataforma.
            </p>
          </section>
        </div>
        
      </div>

      {/* Nota legal disclaimer (Solo para ti como desarrollador, no es mala idea dejarla sutil al fondo) */}
      <div className="max-w-4xl mx-auto mt-8 text-center text-xs text-gray-400">
        <p>Eligetufuturo © {new Date().getFullYear()} - Todos los derechos reservados.</p>
      </div>
    </div>
  );
}