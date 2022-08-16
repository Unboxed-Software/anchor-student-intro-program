use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

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

        msg!("Reply Counter Account Created");
        let reply_counter = &mut ctx.accounts.reply_counter;
        reply_counter.counter = 0;
        msg!("Counter: {}", reply_counter.counter);

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

    pub fn add_reply(ctx: Context<AddReply>, reply: String) -> Result<()> {
        msg!("Reply Account Created");
        msg!("Reply: {}", reply);

        let reply_account = &mut ctx.accounts.reply_account;
        let reply_account_counter = &mut ctx.accounts.reply_counter;

        reply_account.studentinfo = ctx.accounts.student.key();
        reply_account.reply = reply;
        reply_account.count = reply_account_counter.counter;

        reply_account_counter.counter += 1;

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
    #[account(mut)]
    pub student: Signer<'info>,
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
        payer = replier,
        space = 8 + 32 + 4 + reply.len() + 8
    )]
    pub reply_account: Account<'info, Reply>,
    #[account(
        seeds = [student.key().as_ref()],
        bump,
    )]
    pub student_intro: Account<'info, StudentInfo>,
    #[account(
        mut,
        seeds = ["counter".as_bytes(), student_intro.key().as_ref()],
        bump,
    )]
    pub reply_counter: Account<'info, ReplyCounter>,
    #[account(mut)]
    pub replier: Signer<'info>,
    /// CHECK:
    pub student: AccountInfo<'info>,
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
    pub studentinfo: Pubkey, // 32
    pub reply: String,       // 4 + len()
    pub count: u64,          // 8
}
