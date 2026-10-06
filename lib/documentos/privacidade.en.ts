// Single source: generates the PDF (scripts/gerar-pdf.cjs) and the page on the site.
// English translation of privacidade.pt.ts — the Portuguese version prevails.
import type { DocumentoAxioma } from "./tipos"

const doc: DocumentoAxioma = {
  arquivo: 'Axioma - Privacy and Data Protection Policy.docx',
  titulo: 'Privacy Policy',
  subtitulo: 'How Axioma AI.Tech handles and protects personal data and company data, under the LGPD (Brazilian Law no. 13,709/2018)',
  info: ['Version 1.0  •  Effective from [[EFFECTIVE DATE]]', 'This Policy is part of the Axioma Terms of Use.', 'This is a translation provided for convenience. In case of any divergence, the Portuguese version prevails.'],
  blocos: [
    { h1: 'Introduction' },
    { p: 'Privacy is not a detail for Axioma: it is part of the product. This Policy was written so that anyone — the company owner, an invited employee or a customer whose data was entered by a company — clearly understands what happens to their information.' },
    { h2: 'Summary in plain language' },
    { tabela: { colunas: ['Question', 'Short answer'], larguras: [3000, 6026], linhas: [
      ['What data do you have?', 'Your account data, what your company enters in the platform and technical access data (section 3).'],
      ['What do you use it for?', 'Only to provide the service, keep it secure and comply with the law (section 4).'],
      ['Do you sell my data?', 'No. And we do not use it to train third-party artificial intelligence (section 4).'],
      ['Does the AI see my data?', 'Only what is needed to answer the question asked, through contracted providers that cannot use this data to train models (section 5).'],
      ['Who do you share it with?', 'Only with essential suppliers (hosting, database, AI, payments, e-mail), under contract (section 6).'],
      ['How long do you keep it?', 'While the account exists, and afterwards for the minimum periods required by law (section 8).'],
      ['How do you protect it?', 'Encryption, isolation per company, access control and auditing (section 9).'],
      ['What are my rights?', 'Access, correct, delete, take your data to another service and more (section 10).'],
    ] } },
    { nota: 'If you have any questions about your data, talk to our Data Protection Officer. Answering you well is part of our commitment.' },
    { h1: '1. Our commitment' },
    { p: 'Axioma AI.Tech is a financial management platform for companies. To work, it needs to handle information that is sensitive for the Customer\'s business: financial figures, bank accounts, invoices and records of customers, suppliers and team members. We treat this information with the same care we would like ours to receive.' },
    { p: 'This Policy explains, in plain language, what data we process, why, with whom we share it, how long we keep it, how we protect it and what your rights are. It follows the Brazilian General Personal Data Protection Law (LGPD — Law no. 13,709/2018), the Brazilian Internet Civil Framework (Law no. 12,965/2014) and the rules of the Brazilian National Data Protection Authority (ANPD).' },

    { h1: '2. Who is responsible for the data' },
    { p: 'Axioma is offered by [[COMPANY NAME]], CNPJ no. [[CNPJ]], headquartered at [[FULL ADDRESS]].' },
    { p: 'The LGPD distinguishes who decides about the data (**controller**) from who processes it on behalf of another (**processor**). In Axioma it works like this:' },
    { tabela: { colunas: ['Type of data', 'Who decides (controller)', 'Axioma\'s role'], larguras: [3600, 2800, 2626], linhas: [
      ['Your account data: name, e-mail, password, access, preferences', 'Axioma', 'Controller'],
      ['Data your company enters: customers, suppliers, employees, partners, invoices, statements, entries', 'The Customer company', 'Processor (processes only to provide the service)'],
      ['Invitation acceptance term (name, CPF, e-mail of the invitee)', 'The Customer company that invited', 'Processor'],
      ['Subscription payment data', 'Axioma (with Stripe)', 'Controller'],
    ] } },
    { p: '**Data Protection Officer (DPO):** [[DATA PROTECTION OFFICER (DPO) NAME]], e-mail [[DPO E-MAIL]]. This is the channel for any privacy matter (art. 41 of the LGPD).' },

    { h1: '3. What data we process' },
    { h2: '3.1 Registration and account data' },
    { lista: ['Name, e-mail, password (stored encrypted and irreversibly) and preferred language.', 'Linked company, role and access level on the Team, access duration.', 'Records of acceptance of the Terms, the Privacy Policy and invitations, with date and time.'] },
    { h2: '3.2 Team invitation data' },
    { lista: ['Full name and e-mail of the invitee; CPF (Brazilian taxpayer ID) when access is longer than 30 days or has no end date (to securely identify who accesses the company\'s financial data).', 'Name of who sent the invitation, relationship with the company, role, duration and reason.'] },
    { h2: '3.3 Company data (Customer Data)' },
    { lista: [
      'Company registration data: company name, CNPJ, CNAE (activity code), tax regime, address, partners.',
      'Financial entries: revenues, costs, accounts payable and receivable, debts, goals, investments, cost centers.',
      'Customer and supplier records, which may contain third-party personal data (name, CPF/CNPJ, contact, purchase and payment history).',
      'Imported documents: invoices (XML, PDF or photo), statements (OFX), spreadsheets (CSV/XLSX).',
      'Products, inventory and POS sales.',
    ] },
    { h2: '3.4 Bank data (Open Finance)' },
    { p: 'When the Customer connects a bank account, we receive from Pluggy the balances, statements and transactions of the authorized account. **We do not receive or store bank passwords.**' },
    { h2: '3.5 Technical and usage data' },
    { lista: ['IP address, date and time of access, browser and device type (access logs required by the Brazilian Internet Civil Framework).', 'Technical error logs to fix failures.', 'A record of each use of artificial intelligence (screen, type of question, model used, cost and whether figures were checked), **without storing the content of the conversation in this audit record**.', 'Strictly necessary cookies to keep the session open and remember preferences such as language and theme.'] },
    { h2: '3.6 Data we do not ask for' },
    { p: 'Axioma was not designed to process sensitive personal data (such as health, religion, biometrics or political opinion) or data of children and adolescents. We ask the Customer not to enter such data in the Platform.' },

    { h1: '4. What we use the data for and on what legal basis' },
    { tabela: { colunas: ['Purpose', 'Legal basis (LGPD)'], larguras: [5800, 3226], linhas: [
      ['Create and maintain the account, authenticate access and provide the contracted service', 'Performance of contract (art. 7, V)'],
      ['Process the data the company enters to generate reports, analyses, alerts and calculations', 'Performance of contract, according to the instructions of the Customer as controller (arts. 7, V, and 39)'],
      ['Securely identify who receives access to the company\'s financial data (CPF in the invitation)', 'Legitimate interest of the Customer and fraud prevention (art. 7, IX) and performance of contract'],
      ['Connect bank accounts and reconcile statements', 'Consent of the holder in Open Finance and performance of contract (art. 7, I and V)'],
      ['Charge the subscription and issue tax documents', 'Performance of contract and compliance with legal obligation (art. 7, II and V)'],
      ['Keep access logs for 6 months', 'Compliance with legal obligation — art. 15 of the Brazilian Internet Civil Framework (art. 7, II)'],
      ['Ensure security, prevent fraud, abuse and unauthorized access (including anti-bot verification)', 'Legitimate interest (art. 7, IX)'],
      ['Fix errors and improve the Platform using technical data', 'Legitimate interest (art. 7, IX)'],
      ['Exercise rights in judicial, administrative or arbitration proceedings', 'Regular exercise of rights (art. 7, VI)'],
    ] } },
    { nota: 'We do not sell personal data or Customer Data, we do not use it for third-party advertising and we do not use it to train third-party artificial intelligence models.' },

    { h1: '5. Artificial intelligence' },
    { p: 'Some Axioma features use artificial intelligence: Financial AI, Tax AI, the assistant José in Nexus, reading invoices in PDF or photo, classifying purchase items, the explanations in the modules and the **Help Assistant**, which guides the use of the screens (it receives only the question and the relevant manual excerpt, without the company\'s figures).' },
    { lista: [
      'To answer, we send to the AI provider **only the information needed** for that question: a summary of the company\'s figures and the text or document sent.',
      'We use providers that, under their contractual API terms, **do not use this data to train their models**: OpenAI (USA) and Anthropic (USA).',
      'The figures cited by the AI are automatically checked against the company\'s data; when something cannot be checked, the screen says so.',
      'The AI does not make automated decisions that produce legal effects on people. It generates analyses and suggestions that the User evaluates. If any automated decision affects a data subject\'s interests, they may request a review (art. 20 of the LGPD).',
    ] },

    { h1: '6. Who we share data with' },
    { p: 'We share data only with suppliers needed for Axioma to work (sub-processors), under contract and with security and confidentiality obligations:' },
    { tabela: { colunas: ['Supplier', 'What for', 'Where'], larguras: [2400, 4600, 2026], linhas: [
      ['Supabase', 'Database, authentication and file storage', '[[DATABASE REGION]]'],
      ['Vercel', 'Hosting and running the Platform', 'Brazil (São Paulo) and global network'],
      ['OpenAI', 'Artificial intelligence (answers, document reading)', 'USA'],
      ['Anthropic', 'Artificial intelligence (Financial AI, Tax AI, José, reports)', 'USA'],
      ['Pluggy', 'Bank connection via Open Finance and payment initiation', 'Brazil'],
      ['Stripe', 'Subscription billing', 'USA and Brazil'],
      ['Resend', 'Sending e-mails (confirmation codes and invitations)', 'USA'],
      ['Sentry', 'Technical error logging', 'USA'],
      ['Cloudflare', 'Anti-bot verification and abuse protection', 'Global network'],
      ['BrasilAPI and ViaCEP', 'Public lookup of CNPJ and postal code (CEP) to fill in records', 'Brazil'],
    ] } },
    { p: 'We may also share data when required by law, by order of a competent authority or to protect the rights of Axioma, the Customer or third parties. Nexus market information comes from public sources, such as the Central Bank of Brazil, IBGE, the World Bank and international organizations, and does not involve personal data.' },

    { h1: '7. International transfer' },
    { p: 'Some suppliers process data outside Brazil, mainly in the United States. These transfers take place to perform the contract with the Customer and with contractual protection safeguards, under art. 33 of the LGPD and the ANPD regulation on international data transfer.' },

    { h1: '8. How long we keep data' },
    { tabela: { colunas: ['Data', 'Period'], larguras: [5200, 3826], linhas: [
      ['Account data and Customer Data', 'While the account is active; after closure, 30 days for export and then deletion or anonymization'],
      ['Access logs (IP, date and time)', '6 months (Brazilian Internet Civil Framework, art. 15)'],
      ['Acceptance term of someone who left the team', '60 days in the trash and then automatic deletion'],
      ['Accounts Payable change history sent to the trash', '30 days and then automatic deletion'],
      ['Strategic plans generated by the AI in Nexus', '90 days'],
      ['Nexus executive dashboards', '180 days'],
      ['AI usage audit log (without content)', '365 days'],
      ['Tax and billing data of the subscription', 'For the period required by tax legislation'],
    ] } },
    { p: 'Data may be kept longer when needed to comply with a legal obligation or for defense in proceedings, always for the minimum period necessary.' },

    { h1: '9. How we protect it' },
    { lista: [
      'Encryption of data in transit (HTTPS/TLS) and passwords stored irreversibly.',
      '**Isolation per company:** rules in the database itself prevent one company from seeing another\'s data.',
      'Access control by role and hierarchy (Owner, CEO, Partner, Administrator and others), with the cashier limited to the POS and unable to see costs.',
      'Invitations tied to an e-mail, confirmed by code, with a duration and a responsibility term.',
      'Anti-bot verification at sign-up and login, and a limit on attempts.',
      'Audit log of relevant actions and AI calls.',
      'Error monitoring and continuous security fixes.',
    ] },
    { p: 'No system is 100% invulnerable. In the event of a security incident that may cause relevant risk or damage to data subjects, we will notify the Customer, the affected data subjects and the ANPD within the time and in the manner set by regulation (art. 48 of the LGPD).' },

    { h1: '10. Your rights as a data subject' },
    { p: 'The LGPD (art. 18) guarantees the personal data subject the right to:' },
    { lista: [
      'Confirm whether we process their data and access it.',
      'Correct incomplete, inaccurate or outdated data.',
      'Request anonymization, blocking or deletion of unnecessary or excessive data, or data processed in breach of the law.',
      'Request portability of the data to another supplier.',
      'Request deletion of data processed based on consent.',
      'Know who we share their data with.',
      'Be informed about the possibility of not consenting and its consequences.',
      'Revoke consent, when that is the legal basis.',
      'File a petition with the ANPD.',
    ] },
    { p: 'How to exercise them: send the request to [[DPO E-MAIL]]. We will reply within 15 days. If the data was entered by a Customer company (for example, you are a customer or supplier of that company), we will forward the request to it, as the controller, and support the response.' },
    { p: 'Many actions can already be done directly in the Platform: edit account data, export reports, leave a company and, for the Owner and Administrators, delete the personal data of invitation terms.' },

    { h1: '11. Cookies' },
    { p: 'We use only cookies and local storage that are strictly necessary to keep the session open, protect access and remember preferences (language, theme, active company). We do not use advertising cookies. If usage statistics tools are adopted, this Policy will be updated and, when required, we will ask for consent.' },

    { h1: '12. Children and adolescents' },
    { p: 'Axioma is intended for companies and people over 18. We do not knowingly process data of children and adolescents. If we identify such processing, the data will be deleted.' },

    { h1: '13. Customer obligations as controller' },
    { p: 'When the Customer company enters third-party personal data in Axioma, it is the controller of that data and undertakes to:' },
    { lista: [
      'Have an adequate legal basis for each piece of data entered and inform data subjects when required by law.',
      'Enter only the data needed for the purpose of managing the company.',
      'Grant Team access only to those who need it, for the shortest time and at the lowest possible level.',
      'Handle data subjects\' requests, with our support.',
    ] },

    { h1: '14. Changes to this Policy' },
    { p: 'This Policy may be updated to reflect legal, technical or supplier changes. Relevant changes will be announced on the Platform or by e-mail with reasonable notice. The effective date at the beginning of the document indicates the current version.' },

    { h1: '15. Contact' },
    { p: 'Data Protection Officer: [[DATA PROTECTION OFFICER (DPO) NAME]] — [[DPO E-MAIL]].' },
    { p: '[[COMPANY NAME]] — CNPJ [[CNPJ]] — [[FULL ADDRESS]] — [[CONTACT E-MAIL]].' },
  ],
}

export default doc
