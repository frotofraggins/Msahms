import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSend = vi.fn().mockResolvedValue({ MessageId: 'test-message-id-1' });

vi.mock('@aws-sdk/client-sesv2', () => ({
  SESv2Client: vi.fn().mockImplementation(() => ({ send: mockSend })),
  SendEmailCommand: vi
    .fn()
    .mockImplementation((input: unknown) => ({ input })),
}));

const mod = await import('./email-sender.js');
const { sendUserEmail, wrapHtml, esc } = mod;

const dummyTemplate = {
  subject: (d: { name: string }) => `Hi ${d.name}`,
  text: (d: { name: string }) => `Plain text for ${d.name}.`,
  html: (d: { name: string }) => `<p>HTML for ${d.name}.</p>`,
};

describe('sendUserEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends SendEmailCommand with subject, text, html, reply-to', async () => {
    await sendUserEmail('user@example.com', dummyTemplate, { name: 'Alice' });

    expect(mockSend).toHaveBeenCalledOnce();
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.input.Destination.ToAddresses).toEqual(['user@example.com']);
    expect(cmd.input.Content.Simple.Subject.Data).toBe('Hi Alice');
    expect(cmd.input.Content.Simple.Body.Text.Data).toBe('Plain text for Alice.');
    expect(cmd.input.Content.Simple.Body.Html.Data).toBe('<p>HTML for Alice.</p>');
    expect(cmd.input.ReplyToAddresses).toBeInstanceOf(Array);
    expect(cmd.input.ReplyToAddresses[0]).toMatch(/mesahomes\.com/);
  });

  it('skips invalid to addresses', async () => {
    await sendUserEmail('', dummyTemplate, { name: 'X' });
    await sendUserEmail('not-an-email', dummyTemplate, { name: 'X' });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('swallows SES errors so caller is not broken', async () => {
    mockSend.mockRejectedValueOnce(new Error('SES down'));
    await expect(
      sendUserEmail('u@example.com', dummyTemplate, { name: 'Y' }),
    ).resolves.toBeUndefined();
  });
});

describe('wrapHtml + esc', () => {
  it('wraps body in MesaHomes branded shell', () => {
    const out = wrapHtml('<p>body</p>');
    expect(out).toContain('<p>body</p>');
    expect(out).toContain('MesaHomes');
    expect(out).toContain('sales@mesahomes.com');
  });

  it('HTML-escapes user input', () => {
    expect(esc('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
    expect(esc('a"b&c')).toBe('a&quot;b&amp;c');
  });
});
