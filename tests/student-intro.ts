import * as anchor from "@project-serum/anchor"
import { Program } from "@project-serum/anchor"
import { PublicKey } from "@solana/web3.js"
import { getAssociatedTokenAddressSync } from "@solana/spl-token"
import { expect } from "chai"
import { StudentIntro } from "../target/types/student_intro"

describe("student-intro", () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.StudentIntro as Program<StudentIntro>

  const student = {
    name: "name",
    message: "message",
  }

  const realloc = {
    name: "realloc",
    message: "realloc",
  }
  const reply = "reply"

  const [mint] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("mint")],
    program.programId
  )

  const tokenAddress = getAssociatedTokenAddressSync(
    mint,
    provider.wallet.publicKey
  )

  const [studentIntroPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [provider.wallet.publicKey.toBuffer()],
    program.programId
  )

  const [replyCounterPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("counter"), studentIntroPda.toBuffer()],
    program.programId
  )

  it("Initializes the reward token", async () => {
    const tx = await program.methods
      .initializeTokenMint()
      .accounts({
        mint: mint,
      })
      .rpc()
  })

  it("Create Student Intro", async () => {
    const tx = await program.methods
      .addStudentIntro(student.name, student.message)
      .accounts({
        studentIntro: studentIntroPda,
        replyCounter: replyCounterPda,
        rewardMint: mint,
        tokenAccount: tokenAddress,
      })
      .rpc()

    const studentIntroAccount = await program.account.studentInfo.fetch(
      studentIntroPda
    )

    const replyCountAccount = await program.account.replyCounter.fetch(
      replyCounterPda
    )

    expect(studentIntroAccount.name).is.equal(student.name)
    expect(studentIntroAccount.message).is.equal(student.message)
    expect(replyCountAccount.counter.toNumber()).is.equal(0)
  })

  it("Update", async () => {
    const tx = await program.methods
      .updateStudentIntro(realloc.name, realloc.message)
      .accounts({ studentIntro: studentIntroPda })
      .rpc()

    const studentIntroAccount = await program.account.studentInfo.fetch(
      studentIntroPda
    )

    expect(studentIntroAccount.name).is.equal(realloc.name)
    expect(studentIntroAccount.message).is.equal(realloc.message)
  })

  it("Add Reply", async () => {
    const replyCountAccount = await program.account.replyCounter.fetch(
      replyCounterPda
    )

    const [replyPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        studentIntroPda.toBuffer(),
        replyCountAccount.counter.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    )

    const tx = await program.methods
      .addReply(reply)
      .accounts({
        replyAccount: replyPda,
        studentIntro: studentIntroPda,
        replyCounter: replyCounterPda,
        rewardMint: mint,
        tokenAccount: tokenAddress,
      })
      .rpc()

    const replyAccount = await program.account.reply.fetch(replyPda)
    const replyCounter = await program.account.replyCounter.fetch(
      replyCounterPda
    )
    expect(replyAccount.reply).is.equal(reply)
    expect(replyCounter.counter.toNumber()).is.equal(1)
  })

  it("Add Second Reply", async () => {
    const replyCountAccount = await program.account.replyCounter.fetch(
      replyCounterPda
    )

    const [replyPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        studentIntroPda.toBuffer(),
        replyCountAccount.counter.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    )

    const tx = await program.methods
      .addReply(reply)
      .accounts({
        replyAccount: replyPda,
        studentIntro: studentIntroPda,
        replyCounter: replyCounterPda,
        rewardMint: mint,
        tokenAccount: tokenAddress,
      })
      .rpc()

    const replyAccount = await program.account.reply.fetch(replyPda)
    const replyCounter = await program.account.replyCounter.fetch(
      replyCounterPda
    )
    expect(replyAccount.reply).is.equal(reply)
    expect(replyCounter.counter.toNumber()).is.equal(2)
  })

  it("Close", async () => {
    const tx = await program.methods
      .close()
      .accounts({
        studentIntro: studentIntroPda,
      })
      .rpc()
  })
})
