use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount},
};

mod constants;
use constants::*;

declare_id!("F5CRSSYC1ZrDq1tenY36wvGopPoqFJ5Sb3KQjzYa8eYR");

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

        ctx.accounts.student_intro.set_inner(StudentInfo {
            student: ctx.accounts.student.key(),
            name,
            message,
            bump: ctx.bumps.student_intro,
        });

        msg!("Counter Account Created");
        ctx.accounts.reply_counter.set_inner(ReplyCounter {
            counter: 0,
            bump: ctx.bumps.reply_counter,
        });
        msg!("Counter: {}", ctx.accounts.reply_counter.counter);

        let seeds = &[
            "mint".as_bytes(), 
            &[ctx.bumps.reward_mint]
        ];
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

        let seeds = &[
            "mint".as_bytes(), 
            &[ctx.bumps.reward_mint]
        ];
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
        space = StudentInfo::INIT_SPACE + name.len() + message.len()
    )]
    pub student_intro: Account<'info, StudentInfo>,
    #[account(
        init,
        seeds = ["counter".as_bytes(), student_intro.key().as_ref()],
        bump,
        payer = student,
        space = 8 + ReplyCounter::INIT_SPACE,
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
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name:String, message:String)]
pub struct UpdateStudentIntro<'info> {
    #[account(
        mut,
        seeds = [student.key().as_ref()],
        bump = student_intro.bump,
        realloc = StudentInfo::INIT_SPACE + name.len() + message.len(),
        realloc::payer = student,
        realloc::zero = true,
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
        space = Reply::INIT_SPACE + reply.len()
    )]
    pub reply_account: Account<'info, Reply>,
    pub student_intro: Account<'info, StudentInfo>,
    #[account(
        mut,
        seeds = ["counter".as_bytes(), student_intro.key().as_ref()],
        bump = reply_counter.bump,
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
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(
        mut, 
        close = student, 
        has_one = student, 
        seeds = [student.key().as_ref()],
        bump = student_intro.bump,
    )]
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
    pub bump: u8,        // 1
}

impl Space for StudentInfo {
    const INIT_SPACE: usize = ANCHOR_DISCRIMINATOR + PUBKEY_SIZE + STRING_PREFIX_SIZE + STRING_PREFIX_SIZE + BUMP_SIZE;
}

#[account]
#[derive(InitSpace)]
pub struct ReplyCounter {
    pub counter: u64, // 8
    pub bump: u8, // 1
}

#[account]
pub struct Reply {
    pub studentinfo: Pubkey, // 32
    pub reply: String, // 4 + len()
}

impl Space for Reply {
    const INIT_SPACE: usize = ANCHOR_DISCRIMINATOR + PUBKEY_SIZE + STRING_PREFIX_SIZE;
}
