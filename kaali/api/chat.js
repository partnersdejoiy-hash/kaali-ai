import OpenAI from 'openai';
import crypto from 'crypto';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 25;
const MAX_MESSAGE_LENGTH = 1000;
const rateMap = new Map();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(key) {
  const now = Date.now();
  const bucket = rateMap.get(key) || [];
  const fresh = bucket.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (fresh.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateMap.set(key, fresh);
    return true;
  }

  fresh.push(now);
  rateMap.set(key, fresh);
  return false;
}

function isEscalationRequired(text) {
  const lowered = text.toLowerCase();
  const terms = ['refund dispute', 'legal complaint', 'human agent', 'speak to human', 'angry', 'frustrated'];
  return terms.some((term) => lowered.includes(term));
}

function sanitizeMessage(text) {
  return String(text || '').replace(/[<>]/g, '').slice(0, MAX_MESSAGE_LENGTH);
}

function normalizeRole(role) {
  const allowed = new Set(['guest', 'vendor', 'admin']);
  return allowed.has(role) ? role : 'guest';
}

const baseSystemPrompt =
  'You are KAALI, the Super AI Commerce Agent of DEJOIY INDIA PRIVATE LIMITED. ' +
  'You assist customers, vendors, and admins with structured, secure, and role-based responses. ' +
  'You never perform destructive actions without admin confirmation.';

const rolePrompt = {
  guest: 'Customer permissions: order tracking guidance, policy help, general Q&A, and escalation to SalesIQ support.',
  vendor: 'Vendor permissions: commissions overview, performance summary, and product optimization tips.',
  admin: 'Admin permissions: accept natural-language commands, draft content updates/theme suggestions/code snippets. Require explicit confirmation before execution.',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientToken = req.headers['x-kaali-client-token'];
  const csrfToken = req.headers['x-kaali-csrf'];

  if (!process.env.KAALI_CLIENT_TOKEN || clientToken !== process.env.KAALI_CLIENT_TOKEN || csrfToken !== clientToken) {
    return res.status(403).json({ error: 'Invalid request token' });
  }

  const ip = getClientIp(req);
  const rateKey = crypto.createHash('sha256').update(`${ip}:${clientToken}`).digest('hex');

  if (isRateLimited(rateKey)) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  const role = normalizeRole(req.body?.role);
  const incoming = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const cleanedMessages = incoming
    .filter((msg) => msg && typeof msg.content === 'string' && typeof msg.role === 'string')
    .slice(-12)
    .map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: sanitizeMessage(msg.content),
    }));

  const latestText = cleanedMessages[cleanedMessages.length - 1]?.content || '';

  if (isEscalationRequired(latestText)) {
    return res.status(200).json({
      reply: 'I detected this needs human support. I am escalating this conversation to SalesIQ Support now.',
      escalate: true,
      department: 'Support',
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: `${baseSystemPrompt} ${rolePrompt[role]}` },
        ...cleanedMessages,
      ],
    });

    const reply = completion.choices?.[0]?.message?.content || 'I am ready to help.';
    return res.status(200).json({ reply, role });
  } catch (error) {
    return res.status(500).json({ error: 'KAALI backend error', details: error.message });
  }
}
