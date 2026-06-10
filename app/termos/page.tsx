import Link from 'next/link'

export default function Termos() {
  return (
    <div style={{ background: '#020810', minHeight: '100vh', color: '#c8d8f0' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <Link href="/" style={{ color: '#6ab0ff', fontSize: 14, textDecoration: 'none' }}>
            ← Voltar para o início
          </Link>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginTop: 24, marginBottom: 8, background: 'linear-gradient(135deg, #c8d8f0, #6ab0ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Termos de Serviço
          </h1>
          <p style={{ color: '#3a5a8a', fontSize: 14 }}>
            Axioma AI.Tech — Última atualização: junho de 2026
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#6ab0ff', marginBottom: 12 }}>1. Aceitação dos Termos</h2>
            <p style={{ lineHeight: 1.8, color: '#7a9aba' }}>
              Ao acessar e usar a plataforma <strong style={{ color: '#c8d8f0' }}>Axioma AI.Tech</strong> (axiomaai.com.br), você concorda com estes Termos de Serviço. Se não concordar com qualquer parte destes termos, não utilize nossos serviços.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#6ab0ff', marginBottom: 12 }}>2. Descrição do Serviço</h2>
            <p style={{ lineHeight: 1.8, color: '#7a9aba' }}>
              A Axioma AI.Tech é uma plataforma de inteligência financeira que oferece ferramentas para gestão financeira de MEI e pequenas empresas, incluindo controle de receitas, custos, fluxo de caixa, análise de IRPF, precificação e assistência com inteligência artificial. O serviço é fornecido "como está" e pode ser atualizado periodicamente.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#6ab0ff', marginBottom: 12 }}>3. Cadastro e Conta</h2>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Você deve fornecer informações verdadeiras e precisas no cadastro',
                'É responsável por manter a segurança da sua senha e conta',
                'Deve notificar imediatamente qualquer uso não autorizado da sua conta',
                'Uma conta por pessoa/empresa é permitida',
              ].map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#7a9aba' }}>
                  <span style={{ color: '#6ab0ff', marginTop: 2, flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#6ab0ff', marginBottom: 12 }}>4. Planos e Pagamentos</h2>
            <p style={{ lineHeight: 1.8, color: '#7a9aba', marginBottom: 12 }}>
              A Axioma AI.Tech oferece planos pagos com diferentes funcionalidades:
            </p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Plano Starter — funcionalidades básicas de gestão financeira',
                'Plano Pró — acesso completo incluindo módulos de IA',
                'Plano Business — recursos avançados para empresas',
              ].map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#7a9aba' }}>
                  <span style={{ color: '#34d399', marginTop: 2, flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <p style={{ lineHeight: 1.8, color: '#7a9aba', marginTop: 12 }}>
              Os pagamentos são processados de forma segura. O cancelamento pode ser feito a qualquer momento, com acesso mantido até o fim do período pago.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#6ab0ff', marginBottom: 12 }}>5. Uso Aceitável</h2>
            <p style={{ lineHeight: 1.8, color: '#7a9aba', marginBottom: 12 }}>É proibido utilizar a plataforma para:</p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Atividades ilegais ou fraudulentas',
                'Inserir dados falsos ou enganosos',
                'Tentar acessar dados de outros usuários',
                'Sobrecarregar ou prejudicar a infraestrutura da plataforma',
                'Reproduzir ou redistribuir o conteúdo da plataforma sem autorização',
              ].map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#7a9aba' }}>
                  <span style={{ color: '#f87171', marginTop: 2, flexShrink: 0 }}>✗</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#6ab0ff', marginBottom: 12 }}>6. Limitação de Responsabilidade</h2>
            <p style={{ lineHeight: 1.8, color: '#7a9aba' }}>
              As informações fornecidas pela Axioma AI.Tech têm caráter informativo e educacional. <strong style={{ color: '#fbbf24' }}>Não nos responsabilizamos por decisões financeiras, fiscais ou tributárias tomadas com base nas informações da plataforma.</strong> Recomendamos sempre validar informações críticas com profissionais habilitados quando necessário.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#6ab0ff', marginBottom: 12 }}>7. Propriedade Intelectual</h2>
            <p style={{ lineHeight: 1.8, color: '#7a9aba' }}>
              Todo o conteúdo da plataforma Axioma AI.Tech, incluindo código, design, logotipos, textos e funcionalidades, é propriedade exclusiva da Axioma AI.Tech e protegido por leis de propriedade intelectual. Os dados inseridos pelo usuário pertencem ao próprio usuário.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#6ab0ff', marginBottom: 12 }}>8. Disponibilidade do Serviço</h2>
            <p style={{ lineHeight: 1.8, color: '#7a9aba' }}>
              Nos esforçamos para manter a plataforma disponível 24/7, mas não garantimos disponibilidade ininterrupta. Manutenções programadas serão comunicadas com antecedência. Não nos responsabilizamos por perdas decorrentes de indisponibilidade temporária.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#6ab0ff', marginBottom: 12 }}>9. Modificações dos Termos</h2>
            <p style={{ lineHeight: 1.8, color: '#7a9aba' }}>
              Podemos atualizar estes termos periodicamente. Notificaremos usuários sobre mudanças significativas por e-mail ou aviso na plataforma. O uso continuado após as alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#6ab0ff', marginBottom: 12 }}>10. Contato</h2>
            <p style={{ lineHeight: 1.8, color: '#7a9aba' }}>
              Para dúvidas sobre estes termos, entre em contato:
              <br />
              <strong style={{ color: '#c8d8f0' }}>E-mail:</strong>{' '}
              <a href="mailto:axioma.ai.tech@gmail.com" style={{ color: '#6ab0ff' }}>axioma.ai.tech@gmail.com</a>
              <br />
              <strong style={{ color: '#c8d8f0' }}>Site:</strong>{' '}
              <a href="https://axiomaai.com.br" style={{ color: '#6ab0ff' }}>axiomaai.com.br</a>
            </p>
          </section>

        </div>

        {/* Footer */}
        <div style={{ marginTop: 64, paddingTop: 24, borderTop: '1px solid rgba(59,111,212,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ color: '#3a5a8a', fontSize: 12 }}>© 2026 Axioma AI.Tech. Todos os direitos reservados.</p>
          <Link href="/privacidade" style={{ color: '#6ab0ff', fontSize: 12, textDecoration: 'none' }}>
            ← Política de Privacidade
          </Link>
        </div>

      </div>
    </div>
  )
}