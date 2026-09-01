import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { UpdateEditorsNoteDto } from './dto/update-editors-note.dto.js';

export interface EditorsNoteValue {
  title: string;
  note: string;
  bgImageSrc: string;
}

const DEFAULT_NOTE: EditorsNoteValue = {
  title: "Editor's Note",
  note: "This month we celebrate the voices shaping Malayalam literature today. Read slowly, share widely, and – if you have a story of your own – write it. Every submission passes through our editorial board before it reaches you.",
  bgImageSrc: "/images/home/editorialNot.webp",
};

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getEditorsNote(): Promise<EditorsNoteValue> {
    const row = await this.prisma.queryOne<{ value: any }>(
      `SELECT value FROM site_setting WHERE key = 'editors_note' LIMIT 1`,
    );

    if (!row || !row.value) {
      return DEFAULT_NOTE;
    }

    const val = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
    return {
      title: val.title || DEFAULT_NOTE.title,
      note: val.note || DEFAULT_NOTE.note,
      bgImageSrc: val.bgImageSrc || DEFAULT_NOTE.bgImageSrc,
    };
  }

  async updateEditorsNote(dto: UpdateEditorsNoteDto): Promise<EditorsNoteValue> {
    const current = await this.getEditorsNote();
    const updated: EditorsNoteValue = {
      title: dto.title !== undefined ? dto.title : current.title,
      note: dto.note !== undefined ? dto.note : current.note,
      bgImageSrc: dto.bgImageSrc !== undefined ? dto.bgImageSrc : current.bgImageSrc,
    };

    await this.prisma.execute(
      `INSERT INTO site_setting (key, value, "updatedAt")
       VALUES ('editors_note', $1::jsonb, now())
       ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value, "updatedAt" = now()`,
      [JSON.stringify(updated)],
    );

    return updated;
  }
}
