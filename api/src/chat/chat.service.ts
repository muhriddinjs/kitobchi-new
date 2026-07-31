import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const PARTICIPANT_SELECT = {
  id: true,
  name: true,
  avatarUrl: true,
};

const CONVERSATION_INCLUDE = {
  listing: {
    include: {
      book: { select: { id: true, title: true, coverUrl: true } },
      images: { orderBy: { sortOrder: 'asc' as const }, take: 1 },
    },
  },
  buyer: { select: PARTICIPANT_SELECT },
  seller: { select: PARTICIPANT_SELECT },
  // Last message only — enough for the conversation list preview.
  messages: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    select: { id: true, text: true, senderId: true, createdAt: true },
  },
};

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  // Find-or-create the buyer's conversation for a listing.
  async open(buyerId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing || listing.status === 'HIDDEN') {
      throw new NotFoundException('Eʼlon topilmadi');
    }
    if (listing.sellerId === buyerId) {
      throw new BadRequestException(
        'Oʻzingizning eʼloningizga yozib boʻlmaydi',
      );
    }

    return this.prisma.conversation.upsert({
      where: { listingId_buyerId: { listingId, buyerId } },
      update: {},
      create: { listingId, buyerId, sellerId: listing.sellerId },
      include: CONVERSATION_INCLUDE,
    });
  }

  async myConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      include: CONVERSATION_INCLUDE,
    });

    // Unread = messages sent by the other side that I haven't opened yet.
    const unreadGroups = await this.prisma.message.groupBy({
      by: ['conversationId'],
      where: {
        conversationId: { in: conversations.map((c) => c.id) },
        senderId: { not: userId },
        readAt: null,
      },
      _count: { _all: true },
    });
    const unreadByConversation = new Map(
      unreadGroups.map((g) => [g.conversationId, g._count._all]),
    );

    // Most recently active first (last message, else conversation creation).
    return conversations
      .map((conversation) => ({
        ...conversation,
        unreadCount: unreadByConversation.get(conversation.id) ?? 0,
      }))
      .sort((a, b) => {
        const aTime = a.messages[0]?.createdAt ?? a.createdAt;
        const bTime = b.messages[0]?.createdAt ?? b.createdAt;
        return bTime.getTime() - aTime.getTime();
      });
  }

  // How many conversations have at least one unread message — used for the
  // header badge.
  async unreadCount(userId: string) {
    const groups = await this.prisma.message.groupBy({
      by: ['conversationId'],
      where: {
        conversation: { OR: [{ buyerId: userId }, { sellerId: userId }] },
        senderId: { not: userId },
        readAt: null,
      },
    });
    return { conversations: groups.length };
  }

  async getOne(userId: string, id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: CONVERSATION_INCLUDE,
    });
    if (!conversation) throw new NotFoundException('Suhbat topilmadi');
    this.assertParticipant(conversation, userId);
    return conversation;
  }

  async messages(userId: string, id: string) {
    await this.getOne(userId, id);

    // Opening the thread marks the other side's messages as read.
    await this.prisma.message.updateMany({
      where: { conversationId: id, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });

    return this.prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, name: true } } },
    });
  }

  async sendMessage(userId: string, id: string, text: string) {
    await this.getOne(userId, id);
    return this.prisma.message.create({
      data: { conversationId: id, senderId: userId, text },
      include: { sender: { select: { id: true, name: true } } },
    });
  }

  private assertParticipant(
    conversation: { buyerId: string; sellerId: string },
    userId: string,
  ) {
    if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
      throw new ForbiddenException('Bu suhbat sizga tegishli emas');
    }
  }
}
