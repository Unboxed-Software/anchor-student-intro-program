import * as anchor from "@project-serum/anchor"
import { Program } from "@project-serum/anchor"
import { StudentIntro } from "../target/types/student_intro"
import BN from "bn.js"

describe("student-intro", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env())

  const program = anchor.workspace.StudentIntro as Program<StudentIntro>
  const userWallet = anchor.workspace.StudentIntro.provider.wallet

  it("Is initialized!", async () => {
    const [studentIntroPda] = await anchor.web3.PublicKey.findProgramAddress(
      [userWallet.publicKey.toBuffer()],
      program.programId
    )

    const [replyCounterPda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("counter"), studentIntroPda.toBuffer()],
      program.programId
    )

    const tx = await program.methods
      .addStudentIntro("name", "message")
      .accounts({
        studentIntro: studentIntroPda,
        replyCounter: replyCounterPda,
        student: userWallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc()
    console.log("Your transaction signature", tx)

    const studenIntroAccount = await program.account.studentInfo.fetch(
      studentIntroPda
    )
    console.log(studenIntroAccount)

    const tx2 = await program.methods
      .updateStudentIntro("reallocate", "reallocate")
      .accounts({
        studentIntro: studentIntroPda,
        student: userWallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc()

    const studenIntroAccountRealloc = await program.account.studentInfo.fetch(
      studentIntroPda
    )
    console.log(studenIntroAccountRealloc)

    const [replyPda] = await anchor.web3.PublicKey.findProgramAddress(
      [studentIntroPda.toBuffer(), new BN(0).toArrayLike(Buffer, "le", 8)],
      program.programId
    )

    const tx3 = await program.methods
      .addReply("reply")
      .accounts({
        replyAccount: replyPda,
        studentIntro: studentIntroPda,
        replyCounter: replyCounterPda,
        replier: userWallet.publicKey,
        student: userWallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc()

    const replyAccount = await program.account.reply.fetch(replyPda)
    console.log(replyAccount)

    const [replyPda2] = await anchor.web3.PublicKey.findProgramAddress(
      [studentIntroPda.toBuffer(), new BN(1).toArrayLike(Buffer, "le", 8)],
      program.programId
    )

    const tx4 = await program.methods
      .addReply("reply2")
      .accounts({
        replyAccount: replyPda2,
        studentIntro: studentIntroPda,
        replyCounter: replyCounterPda,
        replier: userWallet.publicKey,
        student: userWallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc()

    const replyAccount2 = await program.account.reply.fetch(replyPda2)
    console.log(replyAccount2)
  })
})
