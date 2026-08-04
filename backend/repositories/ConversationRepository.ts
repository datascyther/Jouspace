import { BaseRepository, toRepositoryError } from './baseRepository';
import type { Database } from '../database.types';

type ConversationRow = Database['public']['Tables']['conversations']['Row'];
type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];
type ConversationUpdate = Database['public']['Tables']['conversations']['Update'];

export type ConversationInput = Omit<ConversationInsert, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};
export type ConversationPatch = Partial<
  Omit<ConversationUpdate, 'id' | 'created_at' | 'updated_at'>
>;

export type { ConversationRow };

export class ConversationRepository extends BaseRepository<'conversations'> {
  constructor() {
    super('conversations');
  }

  async get(id: string): Promise<ConversationRow | null> {
    const { data, error } = await this.client
      .from('conversations')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw toRepositoryError(error, 'ConversationRepository.get');
    return data;
  }

  async create(input: ConversationInput): Promise<ConversationRow> {
    const { data, error } = await this.client
      .from('conversations')
      .insert(input)
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'ConversationRepository.create');
    if (!data) throw new Error('ConversationRepository.create: no row returned.');
    return data;
  }

  async update(id: string, patch: ConversationPatch): Promise<ConversationRow> {
    const { data, error } = await this.client
      .from('conversations')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'ConversationRepository.update');
    if (!data) throw new Error('ConversationRepository.update: no row returned.');
    return data;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client
      .from('conversations')
      .delete()
      .eq('id', id);
    if (error) throw toRepositoryError(error, 'ConversationRepository.remove');
  }

  async addParticipantCount(id: string, delta: number): Promise<void> {
    const conv = await this.get(id);
    if (!conv) throw new Error('ConversationRepository.addParticipantCount: conversation not found');
    const newCount = Math.max(0, (conv.member_count ?? 0) + delta);
    await this.update(id, { member_count: newCount });
  }
}

export const conversationRepository = new ConversationRepository();
export default conversationRepository;
