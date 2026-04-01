import { Resend } from "resend";
import { env } from "$env/dynamic/private";

function getResend() {
  const key = env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY");
  return new Resend(key);
}

const FROM = "EcoPlate <onboarding@resend.dev>";

export async function sendReservationConfirmation({
  to,
  name,
  pickupCode,
  location,
  locationDetail,
  windowStart,
  windowEnd,
  price,
}: {
  to: string;
  name: string;
  pickupCode: string;
  location: string;
  locationDetail: string;
  windowStart: string;
  windowEnd: string;
  price: number;
}) {
  const resend = getResend();

  const [startH, startM] = windowStart.split(":").map(Number);
  const [endH, endM] = windowEnd.split(":").map(Number);
  const fmt = (h: number, m: number) => {
    const suffix = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
  };
  const window = `${fmt(startH!, startM!)} – ${fmt(endH!, endM!)}`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your Fresh Box is reserved — ${location}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1C2B1C;">
        <div style="background-color: #006838; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
          <h1 style="color: white; font-size: 22px; margin: 0;">Fresh Box Reserved</h1>
          <p style="color: rgba(255,255,255,0.75); font-size: 14px; margin: 6px 0 0;">Hi ${name}, you're all set.</p>
        </div>

        <div style="background-color: #F5F1EB; border-radius: 12px; padding: 20px 24px; margin-bottom: 16px; text-align: center;">
          <p style="font-size: 12px; color: #7A6B5A; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px;">Your pickup code</p>
          <p style="font-family: monospace; font-size: 36px; font-weight: 900; color: #006838; letter-spacing: 0.15em; margin: 0;">${pickupCode}</p>
          <p style="font-size: 12px; color: #7A6B5A; margin: 8px 0 0;">Show this to staff at the counter</p>
        </div>

        <div style="border: 1px solid rgba(0,104,56,0.12); border-radius: 12px; padding: 16px 20px; margin-bottom: 16px;">
          <p style="font-size: 14px; margin: 0 0 8px;"><strong>📍 ${locationDetail}</strong></p>
          <p style="font-size: 14px; margin: 0 0 8px;">⏰ Pick up between <strong>${window}</strong></p>
          <p style="font-size: 14px; margin: 0;">💵 Pay <strong>$${price}</strong> at the counter</p>
        </div>

        <p style="font-size: 12px; color: #7A6B5A; text-align: center; margin: 0;">
          Can't make it? Cancel from the app before the pickup window starts.
        </p>
      </div>
    `,
  });
}

export async function sendDropAlert({
  to,
  name,
  location,
  locationDetail,
  windowStart,
  windowEnd,
  priceMin,
  priceMax,
  dropId,
}: {
  to: string;
  name: string;
  location: string;
  locationDetail: string;
  windowStart: string;
  windowEnd: string;
  priceMin: number;
  priceMax: number;
  dropId: string;
}) {
  const resend = getResend();

  const [startH, startM] = windowStart.split(":").map(Number);
  const [endH, endM] = windowEnd.split(":").map(Number);
  const fmt = (h: number, m: number) => {
    const suffix = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
  };
  const window = `${fmt(startH!, startM!)} – ${fmt(endH!, endM!)}`;
  const appUrl = env.PUBLIC_APP_URL ?? "https://ecoplate.app";

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Fresh Boxes just dropped at ${location} 🌱`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1C2B1C;">
        <div style="background-color: #006838; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
          <h1 style="color: white; font-size: 22px; margin: 0;">Fresh Boxes are live!</h1>
          <p style="color: rgba(255,255,255,0.75); font-size: 14px; margin: 6px 0 0;">Hi ${name}, tonight's drop is ready.</p>
        </div>

        <div style="border: 1px solid rgba(0,104,56,0.12); border-radius: 12px; padding: 16px 20px; margin-bottom: 20px;">
          <p style="font-size: 14px; margin: 0 0 8px;"><strong>📍 ${locationDetail}</strong></p>
          <p style="font-size: 14px; margin: 0 0 8px;">⏰ Pickup window: <strong>${window}</strong></p>
          <p style="font-size: 14px; margin: 0;">💵 From <strong>$${priceMin}–$${priceMax}</strong> — pay at the counter</p>
        </div>

        <a href="${appUrl}/drop/${dropId}"
           style="display: block; background-color: #006838; color: white; text-decoration: none; text-align: center; padding: 16px; border-radius: 12px; font-weight: 700; font-size: 16px; margin-bottom: 16px;">
          Reserve Your Box →
        </a>

        <p style="font-size: 12px; color: #7A6B5A; text-align: center; margin: 0;">
          Boxes go fast — reserve before the window starts.
        </p>
      </div>
    `,
  });
}
