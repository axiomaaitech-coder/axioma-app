// Single source: generates the PDF (scripts/gerar-pdf.cjs) and the page on the site.
// English translation of termos.pt.ts — the Portuguese version prevails.
import type { DocumentoAxioma } from "./tipos"

const doc: DocumentoAxioma = {
  arquivo: 'Axioma - Terms of Use.docx',
  titulo: 'Terms of Use',
  subtitulo: 'License agreement for the use of the Axioma AI.Tech platform',
  info: ['Version 1.0  •  Effective from [[EFFECTIVE DATE]]', 'Please read carefully. By creating an account, accepting an invitation or using Axioma, you agree to these Terms.', 'This is a translation provided for convenience. In case of any divergence, the Portuguese version prevails.'],
  blocos: [
    { h1: 'Introduction' },
    { p: 'Welcome to Axioma. These Terms of Use are the agreement between you and Axioma about how the platform works, what each party commits to do and how we protect you and your company. We wrote this document to be read, not just accepted: the clauses follow Brazilian law, but the language was designed to be clear.' },
    { p: 'Axioma handles sensitive information — your company\'s figures, bank accounts, taxes and personal data. That is why three principles guide all the rules below:' },
    { lista: [
      '**Your data is yours.** We use the information only to provide the service you contracted. We do not sell data and we do not use it to train third-party artificial intelligence.',
      '**You are in control.** You decide who on your team accesses what and for how long, you can export your data and you can close the account whenever you want.',
      '**Transparency and good faith.** We give advance notice when something important changes and we clearly explain what the platform does and what it does not do.',
    ] },
    { h2: 'Summary in plain language' },
    { p: 'This summary helps you understand the essentials. It does not replace the full clauses, which follow right after.' },
    { tabela: { colunas: ['Topic', 'In a few words'], larguras: [2600, 6426], linhas: [
      ['What Axioma is', 'A financial management platform with artificial intelligence, contracted by subscription (clauses 4 and 5).'],
      ['Your account', 'It is personal. Keep your password safe and do not share your login (clause 6).'],
      ['Your team', 'You invite people, choose the access level and duration, and can cut access at any time (clause 7).'],
      ['Plans and payment', 'The subscription belongs to the company, has a limit of people per plan and can be cancelled whenever you want (clause 8).'],
      ['Artificial intelligence', 'It supports your decisions, checks the figures it cites and does not decide for you (clause 9).'],
      ['Bank and payments', 'The bank connection depends on your authorization at the bank; no money leaves without your approval (clauses 10 and 11).'],
      ['Your data', 'It belongs to your company, is protected under the LGPD (Brazilian data protection law) and can be exported (clauses 12 and 16).'],
      ['Proper use', 'Do not use Axioma for anything illegal or to access other companies\' data (clause 13).'],
      ['Responsibilities', 'Decisions made based on the analyses are yours; we limit our liability to the extent permitted by law (clauses 17 and 18).'],
    ] } },
    { nota: 'If any rule is unclear, talk to us before accepting. We would rather explain than leave doubts.' },
    { h1: '1. Who we are' },
    { p: 'The **Axioma AI.Tech** platform ("Axioma", "we") is offered by [[COMPANY NAME]], a private legal entity registered under CNPJ no. [[CNPJ]], headquartered at [[FULL ADDRESS]], contact [[CONTACT E-MAIL]].' },
    { p: 'These Terms of Use ("Terms") govern access to and use of Axioma, available at axiomaai.com.br and its subdomains. They must be read together with the **Privacy and Data Protection Policy**, which is part of this agreement.' },

    { h1: '2. Definitions' },
    { p: 'For ease of reading, the words below have the following meaning in these Terms:' },
    { lista: [
      '**Platform or Axioma:** the financial management and business intelligence software offered as a service over the internet (SaaS), including all modules, screens, integrations and artificial intelligence features.',
      '**Customer:** the company (legal entity, including MEI — Brazilian individual micro-entrepreneur) that contracts Axioma and on whose behalf the data is entered.',
      '**User:** every individual who accesses Axioma with their own login, whether the company Owner or someone invited by them.',
      '**Owner:** the User who holds the company in Axioma, responsible for the subscription and for managing the Team.',
      '**Team:** the Users linked to a company by invitation (for example: CEO, partner, administrator, accountant, employee, consultant, cashier).',
      '**Customer Data:** all information that the Customer or its Team enters, imports or connects to Axioma (revenues, costs, bills, invoices, statements, customer and supplier records, among others).',
      '**Subscription or Plan:** the contracted tier (Starter, Pro, Business or Enterprise), with its limits and price.',
      '**Open Finance:** the system regulated by the Central Bank of Brazil that allows, with the holder\'s consent, sharing data and initiating payments between institutions.',
      '**LGPD:** the Brazilian General Personal Data Protection Law (Law no. 13,709/2018).',
    ] },

    { h1: '3. Acceptance and capacity' },
    { p: 'By creating an account, ticking the acceptance box, accepting an invitation or simply using Axioma, the User declares that they have read, understood and agree with these Terms and with the Privacy Policy. If they do not agree, they must not use the Platform.' },
    { p: 'Axioma is intended for business use. Whoever creates a company or contracts a Plan declares that they have the power to represent it and bind it to these Terms. Use by persons under 18 is prohibited.' },
    { p: 'As a service contracted by companies for their own activity, the relationship is governed mainly by the Brazilian Civil Code (Law no. 10,406/2002). When the Customer is a consumer under the law, including in a recognized situation of vulnerability, the rules of the Consumer Protection Code (Law no. 8,078/1990) also apply.' },

    { h1: '4. What Axioma offers' },
    { p: 'Axioma is a financial management and business intelligence platform that brings together, among others, the modules Dashboard, MEI, Financial (revenues, costs, cash flow, income statement, debt and treasury), Accounting and Tax, Growth (goals, investments, simulations and pricing), Commercial (customers, suppliers, accounts payable and receivable, inventory and delinquency), Management (cost centers, document import, reports and Open Finance), POS (point of sale), Nexus (market intelligence with the assistant José), Financial AI, Tax AI and Settings (company, team, plans and AI usage).' },
    { p: 'Modules and features may vary according to the contracted Plan and may be improved, changed or discontinued over time, always with prior notice when the change significantly reduces what was contracted.' },

    { h1: '5. License of use' },
    { p: 'While the Subscription is active, we grant the Customer and its Team a license to use Axioma that is **non-exclusive, non-transferable, non-sublicensable, revocable and limited** to the company\'s internal use, under Law no. 9,609/1998 (Brazilian Software Law).' },
    { p: 'The license does not transfer to the Customer any ownership right over the software, source code, brand, design, texts, calculation models or any other element of the Platform.' },

    { h1: '6. Registration, account and security' },
    { p: 'To use Axioma you must create an account with a valid e-mail and password. The User undertakes to provide true, complete and up-to-date information, and is responsible for the information provided.' },
    { lista: [
      'The account is **personal and non-transferable**. Each person must use their own login; sharing passwords is not allowed.',
      'The User is responsible for keeping their password safe and for all actions carried out with their login.',
      'We use layers of protection such as anti-bot verification and a confirmation code sent by e-mail. These mechanisms do not replace the User\'s own care.',
      'If unauthorized access is suspected, the User must change the password immediately and notify us through the contact channel.',
    ] },

    { h1: '7. Company, Team and access levels' },
    { p: 'Each company in Axioma has an Owner, who can invite other people to the Team. Access levels follow this order: **Owner › CEO › Partner › Administrator › other roles** (accountant, finance, bookkeeping, consultant, read-only and cashier).' },
    { h2: '7.1 Invitations' },
    { lista: [
      'Every invitation is made to a specific e-mail and can only be accepted by that e-mail, with a confirmation code.',
      'The person who invites declares, through an electronic term, that they take responsibility for the access granted to the company\'s financial and banking data.',
      'The invited person provides their name (and CPF — Brazilian taxpayer ID — when access is longer than 30 days or has no end date), confirms the sender and accepts these Terms and the Privacy Policy before entering.',
      'Access may have a duration (24 hours, 3, 7, 30, 60 or 90 days) or no end date, the latter only for Administrator, Partner or CEO.',
    ] },
    { h2: '7.2 Removal, suspension and leaving' },
    { lista: [
      'Access of **up to 30 days** that is cut is ended permanently; a new invitation is needed to come back.',
      'Access of **more than 30 days or with no end date** that is cut is suspended for 7 days and can be restored during that period.',
      'Removing people of an equal or higher level may require the approval of someone above, according to the rules shown on the Team screen.',
      'Any member can leave the company whenever they want, except the Owner, who must first transfer ownership.',
      'The personal data in the acceptance term of someone who leaves the company is kept for 60 days and then deleted automatically.',
    ] },
    { h2: '7.3 Transfer of ownership' },
    { p: 'The Owner can transfer the company to another active Team member, stating the reason. The Subscription goes with the company. The former Owner remains on the Team as Administrator, unless removed later.' },
    { nota: 'The Owner is responsible before Axioma for the people they invite and the access they grant. We recommend always granting the lowest access level needed and for the shortest possible time.' },

    { h1: '8. Plans, subscription and payment' },
    { h2: '8.1 Plans and limits' },
    { p: 'Axioma is offered in plans with different prices and limits, shown on the Plans screen at the time of contracting. The Subscription belongs to the company. The current people limits are:' },
    { tabela: { colunas: ['Plan', 'People on the team (including the Owner)'], larguras: [3000, 6026], linhas: [['Starter', '1'], ['Pro', '2'], ['Business', '5'], ['Enterprise', '10']] } },
    { lista: [
      'The following do not take a seat: the cashier (POS) and the external accountant or consultant.',
      'Each Plan includes **3 temporary invitations of up to 7 days** (for example, for guest analysts). These invitations do not take a seat but, once used, are only renewed when the company moves to a higher Plan.',
      'Access of 8 days or more takes a seat in the Plan.',
      'When the limit is reached, new invitations are blocked until the company changes Plan.',
    ] },
    { h2: '8.2 Billing' },
    { lista: [
      'Payments are processed by Stripe, a company specialized in payments. Axioma does not store full card data.',
      'The Subscription is charged on a recurring basis (monthly, unless another option is chosen) and renewed automatically until cancelled.',
      'If a payment is not confirmed, access may be suspended until it is settled. Customer Data is preserved during the suspension, within the periods of clause 16.',
      'Prices may be adjusted, with at least 30 days\' notice before the next charge. If the Customer does not agree, they may cancel before the adjustment.',
      'Taxes levied on the service follow the applicable legislation.',
    ] },
    { h2: '8.3 Cancellation and refund' },
    { p: 'The Customer may cancel the Subscription at any time. Access continues until the end of the period already paid, with no charge for the following period. There is no proportional refund for periods already started, except when the law guarantees this right, such as the 7-day right of withdrawal for the first contract made over the internet, when the Customer qualifies as a consumer (art. 49 of the Consumer Protection Code).' },

    { h1: '9. Artificial intelligence' },
    { p: 'Axioma uses artificial intelligence (AI) to explain figures, answer questions, read documents, suggest classifications and generate analyses and plans. AI is a **decision-support** tool:' },
    { lista: [
      'Answers are generated from Customer Data and public information, but may contain errors, inaccuracies or omissions. Axioma automatically checks the figures cited by the AI against the company\'s data and flags when something could not be verified.',
      'Decisions made based on the analyses are the sole responsibility of the Customer.',
      'Tax and obligation calculations shown by Axioma follow fixed rules and the legislation in force on the date indicated; changes in the law may alter results.',
      'To generate answers, the parts of Customer Data needed for the question are sent to AI providers (such as OpenAI and Anthropic), under contracts that do not allow this data to be used to train their models. Details are in the Privacy Policy.',
      'Every AI call is logged for audit purposes (without storing the content of the conversation in that log), and usage can be followed on the AI Usage screen.',
    ] },

    { h1: '10. Open Finance and banking integrations' },
    { p: 'The Customer can connect bank accounts to Axioma through Pluggy, an institution operating in the Open Finance Brasil ecosystem. The connection:' },
    { lista: [
      'Depends on the express consent of the account holder, given directly in the financial institution\'s environment, with a defined period and purpose.',
      'Is used to read balances, statements and transactions and reconcile them with Axioma\'s entries.',
      'Can be revoked at any time by the Customer, in Axioma or at the bank.',
      'Follows the rules of the Central Bank of Brazil and the National Monetary Council on Open Finance (Joint Resolution no. 1/2020 and subsequent rules).',
    ] },
    { p: 'Axioma does not have access to the Customer\'s banking password and does not move money without authorization.' },

    { h1: '11. Paying bills through Axioma' },
    { p: 'When the feature is available in the Customer\'s Plan, it will be possible to pay bills via Pix (Brazilian instant payment) from the Accounts Payable screen, using Open Finance payment initiation. In these operations:' },
    { lista: [
      'Every payment must be **authorized by the Customer in their own bank app**. Axioma never withdraws money on its own.',
      'The Customer is responsible for checking the amount, payee and due date before authorizing.',
      'The bill is marked as paid and the receipt is recorded automatically when the institution confirms the payment.',
      'Axioma is not a financial institution and is not liable for refusals, delays or failures caused by the bank, the initiating institution or the payee.',
    ] },

    { h1: '12. Customer Data and data protection' },
    { p: 'Customer Data belongs to the Customer. Axioma processes it only to provide the service, in accordance with these Terms, the Privacy Policy and the LGPD.' },
    { lista: [
      'Regarding personal data that the Customer enters in the Platform about third parties (for example, customers, suppliers, employees and partners), the **Customer is the controller** and **Axioma acts as processor**, handling this data only according to the Customer\'s instructions and for the purposes of the service (art. 39 of the LGPD).',
      'Regarding registration, login and usage data of the Users\' own accounts, **Axioma is the controller**.',
      'The Customer declares that it has an adequate legal basis (art. 7 and, where applicable, art. 11 of the LGPD) to enter third-party personal data in Axioma and undertakes to inform data subjects when required by law.',
      'Axioma adopts technical and administrative security measures, such as encryption in transit, isolation of each company\'s data and role-based access control, and will notify the Customer of security incidents that may cause relevant risk or damage, under art. 48 of the LGPD.',
      'Axioma does not sell Customer Data and does not use it to train third-party artificial intelligence models.',
    ] },

    { h1: '13. Acceptable use' },
    { p: 'It is prohibited to use Axioma to:' },
    { lista: [
      'Commit unlawful acts, fraud, money laundering, tax evasion or any activity contrary to law.',
      'Enter third-party data without a legal basis or violate rights of privacy, image, intellectual property or confidentiality.',
      'Attempt to access other companies\' data, bypass access controls, test vulnerabilities without written authorization or exploit flaws.',
      'Reverse engineer, copy, resell, sublicense or create competing products from the Platform.',
      'Use bots, automated data extraction or abusively overload the infrastructure.',
      'Upload files with viruses, malicious code or illegal content.',
      'Share logins, resell access or circumvent Plan limits.',
    ] },
    { p: 'Non-compliance may lead to immediate suspension or termination of the account, without prejudice to applicable legal measures.' },

    { h1: '14. Intellectual property' },
    { p: 'Axioma, its brand, name, logos, screens, texts, icons, calculation models, knowledge bases, source code and other elements belong to [[COMPANY NAME]] or its licensors and are protected by Laws no. 9,609/1998 (software), no. 9,610/1998 (copyright) and no. 9,279/1996 (industrial property).' },
    { p: 'Customer Data remains the Customer\'s. Suggestions and opinions sent about the Platform may be used freely to improve it, with no obligation of payment.' },

    { h1: '15. Availability, maintenance and support' },
    { lista: [
      'We strive to keep Axioma continuously available, but interruptions may occur due to maintenance, updates, supplier failures (hosting, database, AI providers, banks and Open Finance institutions) or events beyond our control.',
      'Scheduled maintenance will, whenever possible, be carried out at times of lower usage and announced in advance.',
      'Market information shown in Nexus comes from public sources (such as the Central Bank of Brazil, IBGE and international organizations) and may be delayed or unavailable due to failures in those sources.',
      'Support is provided through the channels indicated in the Platform, on business days.',
    ] },

    { h1: '16. Termination, export and deletion of data' },
    { lista: [
      'The Customer may close the account at any time.',
      'We may suspend or terminate access in case of breach of these Terms, non-payment or order from a competent authority.',
      'After termination, the Customer will have **30 days** to export its data using the Platform\'s export features (PDF, spreadsheets and reports).',
      'After this period, Customer Data will be deleted or anonymized, except data that must be kept due to legal or regulatory obligation (for example, access logs kept for 6 months under art. 15 of the Brazilian Internet Civil Framework) or for the exercise of rights in legal proceedings.',
    ] },

    { h1: '17. Limitation of liability' },
    { p: 'To the maximum extent permitted by law:' },
    { lista: [
      'Axioma is provided to support management; results depend on the quality and timeliness of the data entered by the Customer.',
      'We are not liable for business decisions made based on the analyses, nor for lost profits, loss of opportunity or indirect damages.',
      'We are not liable for failures of third parties beyond our control, such as banks, payment institutions, internet providers and public bodies.',
      'Where we are liable, our liability is limited to the amount paid by the Customer to Axioma in the 12 months prior to the event.',
      'These limitations do not apply to cases of willful misconduct or gross negligence, nor do they exclude rights that the law does not allow to be limited.',
    ] },

    { h1: '18. Customer responsibility' },
    { p: 'The Customer is responsible for the data it enters, for the access it grants to its Team and for using the Platform in breach of these Terms or the law, and undertakes to compensate losses caused to Axioma or third parties for these reasons.' },

    { h1: '19. Communications and electronic signature' },
    { p: 'Communications between the parties may be made by e-mail, by notices on the Platform or by notifications. The electronic acceptance of these Terms, of invitation terms and of confirmations recorded on the Platform is legally valid, with a record of date, time and User identification, under Brazilian legislation on electronic documents and signatures.' },

    { h1: '20. Changes to these Terms' },
    { p: 'We may update these Terms to reflect legal, technical or service changes. Relevant changes will be announced at least 30 days in advance. Continued use after the new version takes effect means agreement; if they do not agree, the Customer may cancel the Subscription before then.' },

    { h1: '21. General provisions' },
    { lista: [
      'Tolerating a breach does not mean waiving a right.',
      'If any clause is found invalid, the others remain in force.',
      'The Customer may not assign this agreement without our consent. We may assign it in the event of a corporate reorganization, with the same conditions.',
      'These Terms and the Privacy Policy form the entire agreement between the parties on the use of Axioma.',
    ] },

    { h1: '22. Governing law and jurisdiction' },
    { p: 'These Terms are governed by the laws of the Federative Republic of Brazil. The courts of [[CITY/STATE OF JURISDICTION]] are chosen to settle any disputes, waiving any other, except for the courts of the Customer\'s domicile when the Customer is a consumer, under the law.' },

    { h1: '23. Contact' },
    { p: 'Questions about these Terms: [[CONTACT E-MAIL]].' },
    { p: 'Privacy and data protection matters: Data Protection Officer [[DATA PROTECTION OFFICER (DPO) NAME]], [[DPO E-MAIL]].' },
  ],
}

export default doc
