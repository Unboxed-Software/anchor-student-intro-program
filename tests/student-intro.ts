import * as anchor from "@project-serum/anchor"
import { Program } from "@project-serum/anchor"
import { PublicKey } from "@solana/web3.js"
import { getAssociatedTokenAddressSync } from "@solana/spl-token"
import { findMetadataPda } from "@metaplex-foundation/js"
import { expect } from "chai"
import { StudentIntro } from "../target/types/student_intro"

describe("student-intro", () => {
  anchor.setProvider(anchor.AnchorProvider.env())

  const program = anchor.workspace.StudentIntro as Program<StudentIntro>
  const userWallet = anchor.workspace.StudentIntro.provider.wallet

  const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  )

  const student = {
    name: "name",
    message: "message",
  }

  const realloc = {
    name: "realloc",
    message: "realloc",
  }
  const reply = "reply"

  const [mintPDA] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("mint")],
    program.programId
  )

  const tokenAddress = getAssociatedTokenAddressSync(
    mintPDA,
    userWallet.publicKey
  )

  let studentIntro: PublicKey
  let replyCounter: PublicKey

  it("Create Reward Mint", async () => {
    const metadataPDA = await findMetadataPda(mintPDA)

    const tx = await program.methods
      .createRewardMint(
        "https://arweave.net/hI558P7p936NjKKoRqvXNePQ-r122ji9BnM9vTTJJ_8",
        "Token Name",
        "SYMBOL"
      )
      .accounts({
        metadata: metadataPDA,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })

    const transactionSignature = await tx.rpc()

    // console.log(
    //   `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    // )
  })

  it("Create Student Intro", async () => {
    const tx = await program.methods
      .addStudentIntro(student.name, student.message)
      .accounts({
        tokenAccount: tokenAddress,
      })

    const keys = await tx.pubkeys()

    studentIntro = keys.studentIntro
    replyCounter = keys.replyCounter

    const transactionSignature = await tx.rpc()
    // console.log(
    //   `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    // )

    const studentIntroAccount = await program.account.studentInfo.fetch(
      keys.studentIntro
    )

    const replyCountAccount = await program.account.replyCounter.fetch(
      keys.replyCounter
    )

    expect(studentIntroAccount.name).is.equal(student.name)
    expect(studentIntroAccount.message).is.equal(student.message)
    expect(replyCountAccount.counter.toNumber()).is.equal(0)
  })

  it("Update", async () => {
    const tx = await program.methods.updateStudentIntro(
      realloc.name,
      realloc.message
    )

    const keys = await tx.pubkeys()

    const transactionSignature = await tx.rpc()
    // console.log(
    //   `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    // )

    const studentIntroAccount = await program.account.studentInfo.fetch(
      keys.studentIntro
    )

    expect(studentIntroAccount.name).is.equal(realloc.name)
    expect(studentIntroAccount.message).is.equal(realloc.message)
  })

  it("Add Reply", async () => {
    const tx = await program.methods.addReply(reply).accounts({
      studentIntro: studentIntro,
      replyCounter: replyCounter,
      tokenAccount: tokenAddress,
      // student: userWallet.publicKey,
    })

    const keys = await tx.pubkeys()

    const transactionSignature = await tx.rpc()
    // console.log(
    //   `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    // )

    const replyAccount = await program.account.reply.fetch(keys.replyAccount)
    const replyCount = await program.account.replyCounter.fetch(
      keys.replyCounter
    )
    console.log(replyCount.counter)
    expect(replyAccount.reply).is.equal(reply)
  })

  it("Add Second Reply", async () => {
    const tx = await program.methods.addReply(reply).accounts({
      studentIntro: studentIntro,
      replyCounter: replyCounter,
      tokenAccount: tokenAddress,
    })

    const keys = await tx.pubkeys()

    const transactionSignature = await tx.rpc()
    // console.log(
    //   `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    // )

    const replyAccount = await program.account.reply.fetch(keys.replyAccount)
    const replyCount = await program.account.replyCounter.fetch(
      keys.replyCounter
    )
    console.log(replyCount.counter)
    expect(replyAccount.reply).is.equal(reply)
  })

  it("Close", async () => {
    const tx = await program.methods.close().accounts({
      student: userWallet.publicKey,
    })

    const transactionSignature = await tx.rpc()
    // console.log(
    //   `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    // )
  })
})
