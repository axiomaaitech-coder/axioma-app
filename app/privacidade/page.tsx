import Link from 'next/link'

export default function Privacidade() {
  return (
    <div style={{ background: '#020810', minHeight: '100vh', color: '#c8d8f0' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <Link href="/" style={{ color: '#6ab0ff', fontSize: 14, textDecoration: 'none' }}>
            ← Voltar para o início
          </Link>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginTop: 24, marginBottom: 8, background: 'linear-gradient(135deg, #c8d8f0, #6ab0ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Política de Privacidade
          </h1>
          <p style={{ color: '#3a5a8a', fontSize: 14 }}>
            Axioma AI.Tech — Última atualização: junho de 2026
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#6ab0ff', marginBottom: 12 }}>1. Quem somos</h2>
            <p style={{ lineHeight: 1.8, color: '#7a9aba' }}>
              A <strong style={{ color: '#c8d8f0' }}>Axioma AI.Tech</strong> é uma plataforma de inteligência financeira para microempreendedores individuais (MEI) e pequenas empresas brasileiras, acessível em <strong style={{ color: '#c8d8f0' }}>axiomaai.com.br</strong>. Somos responsáveis pelo tratamento dos seus dados pessoais conforme descrito nesta política.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#6ab0ff', marginBottom: 12 }}>2. Dados que coletamos</h2>
            <p style={{ lineHeight: 1.8, color: '#7a9aba', marginBottom: 12 }}>Coletamos apenas os dados necessários para o funcionamento da plataforma:</p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Nome e endereço de e-mail (para criação de conta)',
                'Dados financeiros inseridos voluntariamente (receitas, custos, metas)',
                'Informações do MEI (categoria, DAS, faturamento)',
                'Dados de acesso e uso da plataforma (logs)',
              ].map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#7a9aba' }}>
                  <span style={{ color: '#6ab0ff', marginTop: 2, flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#6ab0ff', marginBottom: 12 }}>3. Como usamos seus dados</h2>
            <p style={{ lineHeight: 1.8, color: '#7a9aba', marginBottom: 12 }}>Seus dados são utilizados exclusivamente para:</p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Fornecer as funcionalidades da plataforma Axioma',
                'Gerar relatórios e análises financeiras personalizadas',
                'Melhorar continuamente nossos serviços',
                'Comunicações sobre sua conta e atualizações importantes',
              ].map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#7a9aba' }}>
                  <span style={{ color: '#34d399', marginTop: 2, flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#6ab0ff', marginBottom: 12 }}>4. Compartilhamento de dados</h2>
            <p style={{ lineHeight: 1.8, color: '#7a9aba' }}>
              <strong style={{ color: '#f87171' }}>Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros</strong> para fins comerciais. Seus dados podem ser compartilhados apenas com fornecedores de infraestrutura técnica (Supabase, Vercel) estritamente para operação da plataforma, sob acordos de confidencialidade.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#6ab0ff', marginBottom: 12 }}>5. Segurança</h2>
            <p style={{ lineHeight: 1.8, color: '#7a9aba' }}>
              Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados, incluindo criptografia em trânsito (HTTPS), isolamento de dados por usuário (Row Level Security), autenticação segura e monitoramento contínuo.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#6ab0ff', marginBottom: 12 }}>6. Seus direitos (LGPD)</h2>
            <p style={{ lineHeight: 1.8, color: '#7a9aba', marginBottom: 12 }}>Conforme a Lei Geral de Proteção de Dados (LGPD), você tem direito a:</p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Acessar seus dados pessoais',
                'Corrigir dados incompletos ou incorretos',
                'Solicitar a exclusão dos seus dados',
                'Revogar consentimento a qualquer momento',
                'Portabilidade dos seus dados',
              ].map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#7a9aba' }}>
                  <span style={{ color: '#a78bfa', marginTop: 2, flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#6ab0ff', marginBottom: 12 }}>7. Login com Google</h2>
            <p style={{ lineHeight: 1.8, color: '#7a9aba' }}>
              Ao usar o login com Google, coletamos apenas seu nome e e-mail fornecidos pelo Google. Não acessamos outros dados da sua conta Google. Você pode revogar o acesso a qualquer momento nas configurações da sua conta Google.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#6ab0ff', marginBottom: 12 }}>8. Retenção de dados</h2>
            <p style={{ lineHeight: 1.8, color: '#7a9aba' }}>
              Seus dados são mantidos enquanto sua conta estiver ativa. Ao solicitar exclusão da conta, seus dados serão removidos em até 30 dias, exceto quando houver obrigação legal de retenção.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#6ab0ff', marginBottom: 12 }}>9. Contato</h2>
            <p style={{ lineHeight: 1.8, color: '#7a9aba' }}>
              Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato:
              <br />
              <strong style={{ color: '#c8d8f0' }}>E-mail:</strong>{' '}
              <a href="mailto:axioma.ai.tech@gmail.com" style={{ color: '#6ab0ff' }}>axioma.ai.tech@gmail.com</a>
            </p>
          </section>

        </div>

        {/* Footer */}
        <div style={{ marginTop: 64, paddingTop: 24, borderTop: '1px solid rgba(59,111,212,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ color: '#3a5a8a', fontSize: 12 }}>© 2026 Axioma AI.Tech. Todos os direitos reservados.</p>
          <Link href="/termos" style={{ color: '#6ab0ff', fontSize: 12, textDecoration: 'none' }}>
            Termos de Serviço →
          </Link>
        </div>

      </div>
    </div>
  )
}