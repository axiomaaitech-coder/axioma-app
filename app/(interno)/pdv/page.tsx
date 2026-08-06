"use client";
import ModuloLayout from "../../../components/ModuloLayout";
import { useLanguage } from "../../../lib/LanguageContext";

type Idioma = "pt" | "en" | "es";

const txt = {
  titulo: { pt: "PDV — Ponto de Venda", en: "POS — Point of Sale", es: "PDV — Punto de Venta" },
  subtitulo: {
    pt: "Em construção — chegando em breve com catálogo, cadastro, frente de caixa e fechamento.",
    en: "Under construction — coming soon with catalog, registration, checkout and closing.",
    es: "En construcción — llegando pronto con catálogo, registro, caja y cierre.",
  },
  corpo: {
    pt: "Este módulo ainda está sendo construído. Volte em breve.",
    en: "This module is still being built. Check back soon.",
    es: "Este módulo todavía está en construcción. Vuelva pronto.",
  },
};

export default function PDV() {
  const { idioma } = useLanguage();
  const lang: Idioma = (["pt", "en", "es"].includes(idioma) ? idioma : "pt") as Idioma;

  return (
    <ModuloLayout titulo={txt.titulo[lang]} subtitulo={txt.subtitulo[lang]}>
      <div className="flex items-center justify-center py-16 px-4">
        <p className="text-sm text-center max-w-md" style={{ color: "#5a7a9a" }}>
          {txt.corpo[lang]}
        </p>
      </div>
    </ModuloLayout>
  );
}
