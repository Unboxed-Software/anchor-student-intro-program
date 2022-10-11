import * as anchor from "@project-serum/anchor"
import { Program } from "@project-serum/anchor"
import { StudentIntro } from "../target/types/student_intro"
import { expect } from "chai"
import BN from "bn.js"

describe("student-intro", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env())

  const program = anchor.workspace.StudentIntro as Program<StudentIntro>
  const userWallet = anchor.workspace.StudentIntro.provider.wallet

  const student = {
    name: "name",
    message: "message",
  }

  const realloc = {
    name: "realloc",
    message: "realloc",
  }

  const [studentIntroPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [userWallet.publicKey.toBuffer()],
    program.programId
  )

  it("Add Student Intro", async () => {
    const tx = await program.methods
      .addStudentIntro(student.name, student.message)
      .accounts({
        studentIntro: studentIntroPda,
        student: userWallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc()

    const account = await program.account.studentInfo.fetch(studentIntroPda)
    expect(student.name === account.name)
    expect(student.message === account.message)
  })

  it("Update Student Intro", async () => {
    const tx = await program.methods
      .updateStudentIntro(realloc.name, realloc.message)
      .accounts({
        studentIntro: studentIntroPda,
        student: userWallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc()

    const account = await program.account.studentInfo.fetch(studentIntroPda)
    expect(realloc.name === account.name)
    expect(realloc.message === account.message)
  })

  it("Close Account", async () => {
    const tx = await program.methods
      .close()
      .accounts({
        studentIntro: studentIntroPda,
        student: userWallet.publicKey,
      })
      .rpc()

    const account = await program.account.studentInfo.fetch(studentIntroPda)
  })
})
