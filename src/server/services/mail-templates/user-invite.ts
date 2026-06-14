export function buildUserInviteEmail(params: {
  inviteeName: string;
  orgName: string;
  activationUrl: string;
}): { subject: string; html: string } {
  const { inviteeName, orgName, activationUrl } = params;
  return {
    subject: `Activez votre compte ${orgName}`,
    html: `
<p>Bonjour ${inviteeName},</p>
<p>Vous avez été invité(e) à rejoindre <strong>${orgName}</strong> sur Qualiopi Charlie.</p>
<p>Cliquez sur le lien ci-dessous pour définir votre mot de passe et activer votre compte :</p>
<p><a href="${activationUrl}">${activationUrl}</a></p>
<p>Ce lien expire dans 7 jours.</p>
<p>Si vous n'attendiez pas cette invitation, ignorez cet email.</p>
`.trim(),
  };
}
