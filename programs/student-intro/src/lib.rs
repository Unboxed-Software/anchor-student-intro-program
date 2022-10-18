use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount},
};

declare_id!("2uRQTjVnidsgxpGuHb6nTiiHVbsYKJmkXBaDrC4B2Nm9");

#[program]
pub mod student_intro {
    use super::*;

    pub fn add_student_intro(
        ctx: Context<AddStudentIntro>,
        name: String,
        message: String,
    ) -> Result<()> {
        msg!("Student Intro Account Created");
        msg!("Name: {}", name);
        msg!("Message: {}", message);

        let student_intro = &mut ctx.accounts.student_intro;
        student_intro.student = ctx.accounts.student.key();
        student_intro.name = name;
        student_intro.message = message;

        msg!("Counter Account Created");
        let reply_counter = &mut ctx.accounts.reply_counter;
        reply_counter.counter = 0;
        msg!("Counter: {}", reply_counter.counter);

        let seeds = &["mint".as_bytes(), &[*ctx.bumps.get("reward_mint").unwrap()]];

        let signer = [&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint: ctx.accounts.reward_mint.to_account_info(),
                to: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.reward_mint.to_account_info(),
            },
            &signer,
        );

        token::mint_to(cpi_ctx, 10000000)?;
        msg!("Minted Tokens");

        Ok(())
    }

    pub fn add_reply(ctx: Context<AddReply>, reply: String) -> Result<()> {
        msg!("Reply Account Created");
        msg!("Reply: {}", reply);

        let reply_account = &mut ctx.accounts.reply_account;
        let reply_counter = &mut ctx.accounts.reply_counter;

        reply_account.studentinfo = ctx.accounts.student_intro.key();
        reply_account.reply = reply;

        reply_counter.counter += 1;

        let seeds = &["mint".as_bytes(), &[*ctx.bumps.get("reward_mint").unwrap()]];

        let signer = [&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint: ctx.accounts.reward_mint.to_account_info(),
                to: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.reward_mint.to_account_info(),
            },
            &signer,
        );

        token::mint_to(cpi_ctx, 5000000)?;
        msg!("Minted Tokens");

        Ok(())
    }

    pub fn update_student_intro(
        ctx: Context<UpdateStudentIntro>,
        name: String,
        message: String,
    ) -> Result<()> {
        msg!("Updating Student Intro Account");
        msg!("Name: {}", name);
        msg!("Message: {}", message);

        let student_intro = &mut ctx.accounts.student_intro;
        student_intro.student = ctx.accounts.student.key();
        student_intro.name = name;
        student_intro.message = message;

        Ok(())
    }

    pub fn close(_ctx: Context<Close>) -> Result<()> {
        Ok(())
    }

    pub fn initialize_token_mint(_ctx: Context<InitializeMint>) -> Result<()> {
        msg!("Token mint initialized");
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(name:String, message:String)]
pub struct AddStudentIntro<'info> {
    #[account(
        init,
        seeds = [student.key().as_ref()],
        bump,
        payer = student,
        space = 8 + 32 + 4 + name.len() + 4 + message.len()
    )]
    pub student_intro: Account<'info, StudentInfo>,
    #[account(
        init,
        seeds = ["counter".as_bytes(), student_intro.key().as_ref()],
        bump,
        payer = student,
        space = 8 + 8
    )]
    pub reply_counter: Account<'info, ReplyCounter>,
    #[account(mut,
        seeds = ["mint".as_bytes().as_ref()],
        bump
    )]
    pub reward_mint: Account<'info, Mint>,
    #[account(
        init_if_needed,
        payer = student,
        associated_token::mint = reward_mint,
        associated_token::authority = student
    )]
    pub token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub student: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name:String, message:String)]
pub struct UpdateStudentIntro<'info> {
    #[account(
        mut,
        seeds = [student.key().as_ref()],
        bump,
        realloc = 8 + 32 + 4 + name.len() + 4 + message.len(),
        realloc::payer = student,
        realloc::zero = false,
    )]
    pub student_intro: Account<'info, StudentInfo>,
    #[account(mut)]
    pub student: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(reply:String)]
pub struct AddReply<'info> {
    #[account(
        init,
        seeds = [student_intro.key().as_ref(), &reply_counter.counter.to_le_bytes()],
        bump,
        payer = student,
        space = 8 + 32 + 4 + reply.len()
    )]
    pub reply_account: Account<'info, Reply>,
    pub student_intro: Account<'info, StudentInfo>,
    #[account(
        mut,
        seeds = ["counter".as_bytes(), student_intro.key().as_ref()],
        bump,
    )]
    pub reply_counter: Account<'info, ReplyCounter>,
    #[account(mut,
        seeds = ["mint".as_bytes().as_ref()],
        bump
    )]
    pub reward_mint: Account<'info, Mint>,
    #[account(
        init_if_needed,
        payer = student,
        associated_token::mint = reward_mint,
        associated_token::authority = student
    )]
    pub token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub student: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(mut, close = student, has_one = student, seeds = [student.key().as_ref()],
        bump,)]
    student_intro: Account<'info, StudentInfo>,
    #[account(mut)]
    student: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitializeMint<'info> {
    #[account(
        init,
        seeds = [b"mint"],
        bump,
        payer = user,
        mint::decimals = 6,
        mint::authority = mint,
    )]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct StudentInfo {
    pub student: Pubkey, // 32
    pub name: String,    // 4 + len()
    pub message: String, // 4 + len()
}

#[account]
pub struct ReplyCounter {
    pub counter: u64,
}

#[account]
pub struct Reply {
    pub studentinfo: Pubkey,
    pub reply: String,
}
