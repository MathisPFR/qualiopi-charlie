import { Modalite } from "@prisma/client";
import { getClientConfig } from "@/lib/config";
import type { FormationFull } from "@/server/services/formation-data";

function plainTextToHtml(text: string): string {
  return text
    .trim()
    .split(/\n\n+/)
    .map((block) => `<p>${block.replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
}

function signatureBlock(formateurNom?: string | null): string {
  const cfg = getClientConfig();
  const name = formateurNom?.trim() || "Anne-Hélène JOULAUD";
  return `${name}\n${cfg.orgName} – Organisme de formation certifié Qualiopi\n📧 ${cfg.orgEmail}`;
}

function objectifsListe(formation: FormationFull): string {
  if (formation.objectifs.length === 0) return "• —";
  return formation.objectifs.map((o) => `• ${o.libelle}`).join("\n");
}

export type LaunchStagiaireEmail = {
  subject: string;
  html: string;
  /** Variante Make : distanciel avec programme en PJ */
  withProgramme: boolean;
};

export function launchStagiaireEmail(
  formation: FormationFull,
  lienBesoins: string,
  options: { withLivret: boolean; withProgramme: boolean }
): LaunchStagiaireEmail {
  const intitule = formation.intituleCommercial;
  const subject = `Bienvenue dans votre formation  ${intitule} 🎓 – Documents à compléter`;

  const programmeBlock = options.withProgramme
    ? `\n\nVous trouverez en pièce jointe le programme de formation pour que vous puissiez en prendre connaissance avant le démarrage.`
    : "";

  const livretPoint = options.withLivret
    ? `\n\n3. Le livret d'accueil de la formation.`
    : "";

  const text = `Bonjour,

Nous sommes ravis de vous accueillir prochainement pour la formation "${intitule}" et avons hâte de vous accompagner dans cet apprentissage !${programmeBlock}

Pour bien préparer votre parcours, voici ce que nous vous demandons avant le démarrage :

1. Évaluation de vos besoins individuels
Prenez 5 minutes pour compléter ce formulaire — il nous permet d'adapter au mieux le contenu à votre profil et à vos attentes :
👉 ${lienBesoins}

2. Règlement intérieur
Vous trouverez en pièce jointe notre règlement intérieur. Merci de le lire et de nous le retourner signé.${livretPoint}

---

Ces éléments nous permettent de vous préparer les meilleures conditions d'apprentissage. Si vous avez la moindre question, nous sommes disponibles et ravis de vous répondre.

À très vite,

${signatureBlock(formation.formateur?.nom)}`;

  return {
    subject,
    html: plainTextToHtml(text),
    withProgramme: options.withProgramme,
  };
}

export function launchEntrepriseEmail(
  formation: FormationFull,
  lienBesoins: string
): { subject: string; html: string } {
  const intitule = formation.intituleCommercial;
  const text = `Bonjour,

Nous sommes ravis de vous accompagner dans ce projet de formation "${intitule}".

En tant que responsable de l'entreprise, vous trouverez ci-joint les documents administratifs nécessaires au démarrage :

1. Évaluation des besoins entreprise
Ce questionnaire nous permet d'adapter la formation au contexte de votre structure :
👉 ${lienBesoins}

2. Convention de formation
Document officiel à nous retourner signé pour valider l'inscription.

3. Conditions générales de vente
Jointes pour votre information.

4. Devis
Veuillez nous retourner le devis ci-joint signé.

---

Ces éléments sont indispensables pour finaliser l'organisation de la formation. Le ou les stagiaires recevront de leur côté un email distinct avec leurs propres documents à compléter.

N'hésitez pas à nous contacter pour toute question.

Bonne journée,

Anne-Hélène Joulaud
${getClientConfig().orgName} – Organisme de formation certifié Qualiopi
📧 ${getClientConfig().orgEmail}`;

  return {
    subject: `Votre formation ${intitule} – Documents administratifs à compléter 📋`,
    html: plainTextToHtml(text),
  };
}

export function finFormationStagiaireEmail(
  formation: FormationFull,
  lienEvalChaud: string
): { subject: string; html: string } {
  const intitule = formation.intituleCommercial;
  const text = `Bonjour,

La formation "${intitule}" est terminée, et nous espérons qu'elle a répondu à vos attentes !

Votre avis compte beaucoup pour nous. Merci de prendre quelques minutes pour compléter l'évaluation à chaud — vos retours nous permettent d'améliorer continuellement la qualité de nos formations :

👉 ${lienEvalChaud}

Vous trouverez également en pièce jointe votre certificat de réalisation, attestant de votre participation à la formation. N'hésitez pas à le conserver précieusement !

Encore merci pour votre confiance et à bientôt,

${signatureBlock(formation.formateur?.nom)}`;

  return {
    subject: `🎓 Votre certificat et votre avis sur la formation ${intitule}`,
    html: plainTextToHtml(text),
  };
}

export function finFormationEntrepriseEmail(
  formation: FormationFull,
  lienEvalEntreprise: string
): { subject: string; html: string } {
  const intitule = formation.intituleCommercial;
  const text = `Bonjour,

La formation "${intitule}" est arrivée à son terme, et nous espérons qu'elle a pleinement répondu aux besoins de votre entreprise.

Dans le cadre de notre démarche qualité Qualiopi, nous vous invitons à compléter l'évaluation de satisfaction entreprise ci-dessous. Votre retour, en tant que commanditaire, nous permet d'évaluer l'adéquation de la formation avec les besoins de votre structure et d'améliorer continuellement la qualité de nos accompagnements :

👉 ${lienEvalEntreprise}

Vous trouverez également en pièce jointe l'attestation de présence relative à la formation.

Nous restons disponibles pour toute question ou pour évoquer de futurs besoins en formation.

Bonne journée,

${getClientConfig().orgName} – Organisme de formation certifié Qualiopi
📧 ${getClientConfig().orgEmail}`;

  return {
    subject: `Votre avis sur la formation ${intitule} – Évaluation entreprise`,
    html: plainTextToHtml(text),
  };
}

export function evalFroidStagiaireEmail(
  formation: FormationFull,
  lienEvalFroid: string
): { subject: string; html: string } {
  const intitule = formation.intituleCommercial;
  const text = `Bonjour,

Suite à votre formation "${intitule}", nous réalisons aujourd'hui un suivi à froid afin d'évaluer l'impact de celle-ci dans votre activité professionnelle.

👉 Les objectifs de la formation vous sont rappelés dans ce mail. Merci de vous y référer pour compléter le questionnaire.

Votre retour est très important pour nous : il nous permet de mesurer l'efficacité de la formation dans le temps et d'améliorer continuellement la qualité de nos accompagnements.

Objectifs de la formation :
${objectifsListe(formation)}

👉 Merci de prendre quelques minutes pour compléter l'évaluation à froid :
${lienEvalFroid}


⚠️ Important :
- Merci de ne pas modifier les informations pré-remplies
- Remplissez uniquement les objectifs qui vous concernent
- Vous pouvez laisser les autres champs vides

Nous vous remercions pour votre participation et votre implication.

Bien à vous,

${signatureBlock(formation.formateur?.nom)}`;

  return {
    subject: `🎓 Suivi de votre formation – Évaluation à froid  ${intitule}`,
    html: plainTextToHtml(text),
  };
}

export function shouldAttachLivret(modalite: Modalite) {
  return modalite === Modalite.PRESENTIEL || modalite === Modalite.MIXTE;
}
