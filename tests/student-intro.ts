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

    const tx = await program.methods
      .addStudentIntro("name", "message")
      .accounts({
        studentIntro: studentIntroPda,
        student: userWallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc()

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

    const tx3 = await program.methods
      .close()
      .accounts({
        studentIntro: studentIntroPda,
        user: userWallet.publicKey,
      })
      .rpc()
  })
})
