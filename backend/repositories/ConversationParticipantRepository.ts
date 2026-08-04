import { BaseRepository, toRepositoryError } from './baseRepository';
import type { Database } from '../database.types';

type ParticipantRow = Database['public']['Tables']['conversation_participants']['Row'];
type ParticipantInsert = Database['public']['Tables']['conversation_participants']['Insert'];
type ParticipantUpdate = Database['public']['Tables']['conversation_participants']['Update'];

export type ParticipantInput = ParticipantInsert;
export type ParticipantPatch = Partial<
  Omit<ParticipantUpdate, 'conversation_id' | 'user_id'>
>;

export class ConversationParticipantRepository extends BaseRepository<'conversation_participants'> {
  constructor() {
    super('conversation_participants');
  }

  async get(conversationId: string, userId: string): Promise<ParticipantRow | null> {
    const { data, error } = await this.client
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw toRepositoryError(error, 'ConversationParticipantRepository.get');
    return data;
  }

  async listByConversation(conversationId: string): Promise<ParticipantRow[]> {
    const { data, error } = await this.client
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', conversationId);
    if (error) throw toRepositoryError(error, 'ConversationParticipantRepository.listByConversation');
    return data ?? [];
  }

  async create(input: ParticipantInput): Promise<ParticipantRow> {
    const { data, error } = await this.client
      .from('conversation_participants')
      .insert(input)
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'ConversationParticipantRepository.create');
    if (!data) throw new Error('ConversationParticipantRepository.create: no row returned.');
    return data;
  }

  async update(conversationId: string, userId: string, patch: ParticipantPatch): Promise<ParticipantRow> {
    const { data, error } = await this.client
      .from('conversation_participants')
      .update(patch)
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'ConversationParticipantRepository.update');
    if (!data) throw new Error('ConversationParticipantRepository.update: no row returned.');
    return data;
  }

  async remove(conversationId: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);
    if (error) throw toRepositoryError(error, 'ConversationParticipantRepository.remove');
  }
}

export const conversationParticipantRepository = new ConversationParticipantRepository();
export default conversationParticipantRepository;
