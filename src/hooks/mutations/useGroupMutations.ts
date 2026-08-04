import { useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationRepository } from '@/repositories/ConversationRepository';
import { messageRepository } from '@/repositories/MessageRepository';
import type { ConversationMessage } from '@/shared/types';

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      createdBy: string;
      participantIds: string[];
      isSupportGroup?: boolean;
      category?: string;
    }) => {
      return conversationRepository.createGroup(data);
    },
    onSuccess: (_conversationId, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', variables.createdBy] });
    },
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      conversationId: string;
      uid: string;
      userName: string;
    }) => {
      await conversationRepository.addParticipant(data.conversationId, data.uid);
      await messageRepository.sendSystemMessage(
        data.conversationId,
        `${data.userName} joined the group`,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', variables.uid] });
      queryClient.invalidateQueries({ queryKey: ['groupMessages', variables.conversationId] });
    },
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      conversationId: string;
      uid: string;
      userName: string;
    }) => {
      await messageRepository.sendSystemMessage(
        data.conversationId,
        `${data.userName} left the group`,
      );
      await conversationRepository.removeParticipant(data.conversationId, data.uid);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', variables.uid] });
      queryClient.invalidateQueries({ queryKey: ['groupMessages', variables.conversationId] });
    },
  });
}

export function useSendGroupMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      conversationId: string;
      senderId: string;
      senderName: string;
      content: string;
      replyTo?: string;
    }) => {
      return messageRepository.sendMessage(data);
    },
    onMutate: async (data) => {
      const key = ['groupMessages', data.conversationId];
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<ConversationMessage[]>(key);

      const optimistic: ConversationMessage = {
        id: `optimistic-${Date.now()}`,
        senderId: data.senderId,
        senderName: data.senderName,
        content: data.content,
        timestamp: new Date(),
        type: 'text',
        replyTo: data.replyTo,
        readBy: [data.senderId],
      };

      queryClient.setQueryData<ConversationMessage[]>(key, (existing = []) => [
        optimistic,
        ...existing,
      ]);

      return { previous };
    },
    onError: (_err, data, context) => {
      const key = ['groupMessages', data.conversationId];
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['groupMessages', variables.conversationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['conversations', variables.senderId],
      });
    },
  });
}
