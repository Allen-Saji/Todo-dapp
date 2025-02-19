import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TodoDapp } from "../target/types/todo_dapp";
import { utf8 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { expect } from "chai";
import { BN } from "bn.js";

describe("todo_dapp", () => {
  // Configure the client to use the local cluster.

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.TodoDapp as Program<TodoDapp>;
  let encode_user_state = utf8.encode("USER_STATE");

  let [userPDA, _bump] = anchor.web3.PublicKey.findProgramAddressSync(
    [utf8.encode("USER_STATE"), provider.wallet.publicKey.toBuffer()],
    program.programId
  );

  let content_todo = "My name is pranaya raj";

  console.log(`The authority wallet addres is ${provider.wallet.publicKey}`);
  console.log(`The PDA for creating User Profile is: ${userPDA.toString()}`);

  it("Initialized User Profile Account!", async () => {
    console.log("Creating User Profile Account.......");
    const trxHash = await program.methods.initializeUser().rpc();

    let { totalTodo, currentTodoIndex } =
      await program.account.userProfile.fetch(userPDA);
    console.log(`Message from initialize user account ${currentTodoIndex}`);
    expect(totalTodo == 0);
    expect(currentTodoIndex == 0);
  });

  it("Created Todo", async () => {
    try {
      let user_profile_account = await program.account.userProfile.fetch(
        userPDA
      );
      console.log(
        `Message from creating Todo ${user_profile_account.currentTodoIndex}`
      );

      let index = new BN(user_profile_account.currentTodoIndex);

      let [todoPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          utf8.encode("TODO_ACCOUNT"), // little endian formate
          provider.wallet.publicKey.toBuffer(),
          // Buffer.from([user_profile_account.currentTodoIndex]), // little endian formate
          index.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      console.log("The TodoPDA is:", todoPDA.toBase58());

      let trxHash = await program.methods
        .createTodo(content_todo, user_profile_account.currentTodoIndex)
        .rpc();

      let { content, idx, markedBool } =
        await program.account.todoAccount.fetch(todoPDA);

      expect(content).to.equal(content_todo);
      expect(idx).to.equal(user_profile_account.currentTodoIndex);
      expect(markedBool).to.equal(false);
    } catch (e) {
      console.log(`The occured error is : ${e}`);
      // throw e;
    }
  });

  it("Marked Todo", async () => {});
  it("Removed Todo", async () => {});
});

// +++++++++++++++++++++++++++++ Learnings +++++++++++++++++++++++++++
// - for Solana PDAs, the seed should be in little-endian byte format. If you need it in little-endian, you should convert it accordingly.
// - provider.wallet.publicKey.toBuffer(): This returns the public key in big-endian format,
