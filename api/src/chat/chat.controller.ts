import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ChatService } from './chat.service';
import { OpenConversationDto } from './dto/open-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@UseGuards(JwtAuthGuard)
@Controller({ path: 'conversations', version: '1' })
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  open(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: OpenConversationDto,
  ) {
    return this.chatService.open(user.id, dto.listingId);
  }

  @Get()
  myConversations(@CurrentUser() user: AuthenticatedUser) {
    return this.chatService.myConversations(user.id);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.chatService.getOne(user.id, id);
  }

  @Get(':id/messages')
  messages(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.chatService.messages(user.id, id);
  }

  @Post(':id/messages')
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(user.id, id, dto.text);
  }
}
