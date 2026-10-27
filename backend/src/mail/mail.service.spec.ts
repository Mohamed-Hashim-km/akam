import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service.js';

describe('MailService', () => {
  let mailService: MailService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string) => {
              if (key === 'MAIL_SERVICE') {
                return 'accelr_live_sk_test_key_123';
              }
              if (key === 'MAIL_FROM_EMAIL') {
                return 'no-replay@akamdigital.in';
              }
              if (key === 'MAIL_FROM_NAME') {
                return 'AKAM Digital';
              }
              if (key === 'NODE_ENV') {
                return 'test';
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(mailService).toBeDefined();
  });

  it('should send email via Accelr successfully', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: { id: 'test-email-id', status: 'sent' },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await mailService.sendMail({
      to: 'Recipient <user@example.com>',
      subject: 'Test Subject',
      html: '<p>Test Body</p>',
    });

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [calledUrl, calledOptions] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe('https://app.accelr.app/api/v1/emails/send');
    expect(calledOptions.method).toBe('POST');
    expect(calledOptions.headers['Authorization']).toBe('Bearer accelr_live_sk_test_key_123');

    const parsedBody = JSON.parse(calledOptions.body);
    expect(parsedBody.to).toBe('user@example.com');
    expect(parsedBody.from).toBe('AKAM Digital <no-replay@akamdigital.in>');
    expect(parsedBody.subject).toBe('Test Subject');
    expect(parsedBody.html).toBe('<p>Test Body</p>');
  });

  it('should reject invalid recipient email', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await mailService.sendMail({
      to: 'invalid-email-address',
      subject: 'Invalid Test',
      html: '<p>Invalid</p>',
    });

    expect(result).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
