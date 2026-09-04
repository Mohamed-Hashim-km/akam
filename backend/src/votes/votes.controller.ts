import { Controller, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { VotesService } from './votes.service.js';
import { CastVoteDto } from './dto/cast-vote.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@ApiTags('Votes')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post('posts/:postId/vote')
  @ApiOperation({ summary: 'Cast or toggle vote on a post (UP/DOWN)' })
  votePost(
    @Param('postId') postId: string,
    @Body() dto: CastVoteDto,
    @Request() req: any,
  ) {
    return this.votesService.castPostVote(req.user.id, postId, dto.value);
  }

  @Post('comments/:commentId/vote')
  @ApiOperation({ summary: 'Cast or toggle vote on a comment (UP/DOWN)' })
  voteComment(
    @Param('commentId') commentId: string,
    @Body() dto: CastVoteDto,
    @Request() req: any,
  ) {
    return this.votesService.castCommentVote(req.user.id, commentId, dto.value);
  }
}
