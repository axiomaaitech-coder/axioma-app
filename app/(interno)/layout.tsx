import TopNav from "../../components/TopNav";
import NexusEventStream from "../../components/NexusEventStream";
import AjudaAxioma from "../../components/AjudaAxioma";
import GuardiaoRastreio from "../../components/GuardiaoRastreio";
import AvisoAprovacaoEquipe from "../../components/AvisoAprovacaoEquipe";
import AvisoVencimentos from "../../components/AvisoVencimentos";

export default function InternoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#020810" }}>
      <TopNav />
      <main className="flex-1 overflow-auto min-w-0">
        <AvisoVencimentos />
        {children}
      </main>
      <NexusEventStream />
      <AjudaAxioma />
      <GuardiaoRastreio />
      <AvisoAprovacaoEquipe />
    </div>
  );
}