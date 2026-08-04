/**
 * Program Repository
 *
 * `programs` are owned transitively through their parent journey (RLS resolves
 * ownership via the journeys join). The table carries no `user_id`, so writes
 * are scoped by `journey_id` and rely on RLS for authorisation.
 */

import { BaseRepository, toRepositoryError } from './baseRepository';
import type { Database } from '../database.types';

type ProgramRow = Database['public']['Tables']['programs']['Row'];
type ProgramInsert = Database['public']['Tables']['programs']['Insert'];
type ProgramUpdate = Database['public']['Tables']['programs']['Update'];

export type ProgramInput = Omit<ProgramInsert, 'id' | 'created_at' | 'updated_at'>;
export type ProgramPatch = Partial<Omit<ProgramUpdate, 'id' | 'created_at' | 'updated_at'>>;

export class ProgramRepository extends BaseRepository<'programs'> {
  constructor() {
    super('programs');
  }

  async list(): Promise<ProgramRow[]> {
    const { data, error } = await this.client
      .from('programs')
      .select('*')
      .order('position', { ascending: true });
    if (error) throw toRepositoryError(error, 'ProgramRepository.list');
    return data ?? [];
  }

  async listByJourney(journeyId: string): Promise<ProgramRow[]> {
    const { data, error } = await this.client
      .from('programs')
      .select('*')
      .eq('journey_id', journeyId)
      .order('position', { ascending: true });
    if (error) throw toRepositoryError(error, 'ProgramRepository.listByJourney');
    return data ?? [];
  }

  async get(id: string): Promise<ProgramRow | null> {
    const { data, error } = await this.client
      .from('programs')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw toRepositoryError(error, 'ProgramRepository.get');
    return data;
  }

  async create(input: ProgramInput): Promise<ProgramRow> {
    const { data, error } = await this.client
      .from('programs')
      .insert(input)
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'ProgramRepository.create');
    if (!data) throw new Error('ProgramRepository.create: no row returned.');
    return data;
  }

  async update(id: string, patch: ProgramPatch): Promise<ProgramRow> {
    const { data, error } = await this.client
      .from('programs')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw toRepositoryError(error, 'ProgramRepository.update');
    if (!data) throw new Error('ProgramRepository.update: no row returned.');
    return data;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from('programs').delete().eq('id', id);
    if (error) throw toRepositoryError(error, 'ProgramRepository.remove');
  }
}

export const programRepository = new ProgramRepository();
export default programRepository;
