import * as anchor from "@project-serum/anchor"
import { Program } from "@project-serum/anchor"
import { PublicKey } from "@solana/web3.js"
import { getAssociatedTokenAddress } from "@solana/spl-token"
import { StudentIntro } from "../target/types/student_intro"
import { findMetadataPda } from "@metaplex-foundation/js"
import { expect } from "chai"

describe("student-intro", () => {
  anchor.setProvider(anchor.AnchorProvider.env())

  const program = anchor.workspace.StudentIntro as Program<StudentIntro>
  const userWallet = anchor.workspace.StudentIntro.provider.wallet

  const name = "name"
  const message = "message"
  const nameUpdate = "update"
  const messageUpdate = "updated message"
  const reply = "reply"

  var mintPDA: PublicKey
  var tokenAddress: PublicKey
  var studentIntro: PublicKey
  var replyCounter: PublicKey

  before(async () => {
    ;[mintPDA] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("mint")],
      program.programId
    )

    tokenAddress = await getAssociatedTokenAddress(
      mintPDA,
      userWallet.publicKey
    )
  })

  it("Create Reward Mint", async () => {
    const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
      "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
    )

    const metadataPDA = await findMetadataPda(mintPDA)

    const transaction = await program.methods
      .createRewardMint(
        "https://arweave.net/hI558P7p936NjKKoRqvXNePQ-r122ji9BnM9vTTJJ_8",
        "Token Name",
        "SYMBOL"
      )
      .accounts({
        user: userWallet.publicKey,
        metadata: metadataPDA,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })

    const keys = await transaction.pubkeys()
    const transactionSignature = await transaction.rpc()

    console.log(
      `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    )

    console.log(`https://explorer.solana.com/address/${mintPDA}?cluster=devnet`)
  })

  it("Create Student Intro", async () => {
    const tx = await program.methods.addStudentIntro(name, message).accounts({
      tokenAccount: tokenAddress,
      student: userWallet.publicKey,
    })

    const keys = await tx.pubkeys()

    studentIntro = keys.studentIntro
    replyCounter = keys.replyCounter

    const transactionSignature = await tx.rpc()
    console.log(
      `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    )

    const studentIntroAccount = await program.account.studentInfo.fetch(
      keys.studentIntro
    )

    expect(studentIntroAccount.name).is.equal(name)
    expect(studentIntroAccount.message).is.equal(message)
  })

  it("Update", async () => {
    const tx = await program.methods
      .updateStudentIntro(nameUpdate, messageUpdate)
      .accounts({
        student: userWallet.publicKey,
      })

    const keys = await tx.pubkeys()

    const transactionSignature = await tx.rpc()
    console.log(
      `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    )

    const studentIntroAccount = await program.account.studentInfo.fetch(
      keys.studentIntro
    )

    expect(studentIntroAccount.name).is.equal(nameUpdate)
    expect(studentIntroAccount.message).is.equal(messageUpdate)
  })

  it("Add Reply", async () => {
    const tx = await program.methods.addReply(reply).accounts({
      studentIntro: studentIntro,
      replyCounter: replyCounter,
      tokenAccount: tokenAddress,
      student: userWallet.publicKey,
    })

    const keys = await tx.pubkeys()

    const transactionSignature = await tx.rpc()
    console.log(
      `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    )

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
      student: userWallet.publicKey,
    })

    const keys = await tx.pubkeys()

    const transactionSignature = await tx.rpc()
    console.log(
      `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    )

    const replyAccount = await program.account.reply.fetch(keys.replyAccount)
    const replyCount = await program.account.replyCounter.fetch(
      keys.replyCounter
    )
    console.log(replyCount.counter)
    expect(replyAccount.reply).is.equal(reply)
  })

  it("Add Third Reply", async () => {
    const tx = await program.methods.addReply(reply).accounts({
      studentIntro: studentIntro,
      replyCounter: replyCounter,
      tokenAccount: tokenAddress,
      student: userWallet.publicKey,
    })

    const keys = await tx.pubkeys()

    const transactionSignature = await tx.rpc()
    console.log(
      `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    )

    const replyAccount = await program.account.reply.fetch(keys.replyAccount)
    const replyCount = await program.account.replyCounter.fetch(
      keys.replyCounter
    )
    console.log(replyCount.counter)

    expect(replyAccount.reply).is.equal(reply)
  })

  // it("Close", async () => {
  //   const tx = await program.methods.close().accounts({
  //     student: userWallet.publicKey,
  //   })

  //   const transactionSignature = await tx.rpc()
  //   console.log(
  //     `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  //   )
  // })
})
