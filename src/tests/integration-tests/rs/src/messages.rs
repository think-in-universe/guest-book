use serde_json::json;
use near_units::parse_near;
use workspaces::prelude::*; 

const WASM_FILEPATH: &str = "../../../../out/main.wasm";

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let worker = workspaces::sandbox().await?;
    let wasm = std::fs::read(WASM_FILEPATH)?;
    let contract = worker.dev_deploy(&wasm).await?;

    // create accounts
    let owner = worker.root_account();
    let alice = owner
    .create_subaccount(&worker, "alice")
    .initial_balance(parse_near!("30 N"))
    .transact()
    .await?
    .into_result()?;

    // begin test
    owner
        .call(&worker, contract.id(), "addMessage")
        .args_json(json!({"text": "hola"}))?
        .transact()
        .await?;

    alice
        .call(&worker, contract.id(), "addMessage")
        .args_json(json!({"text": "aloha"}))?
        .transact()
        .await?;

    let result: serde_json::Value = alice
        .call(&worker, contract.id(), "getMessages")
        .args_json(json!({}))?
        .transact()
        .await?
        .json()?;

    let expected = json!(
        [{
            "premium": false,
            "sender": owner.id(),
            "text": "hola",
        },
        {
            "premium": false,
            "sender": alice.id(),
            "text": "aloha",
        }]
    );    

    assert_eq!(result, expected);
    println!("      Passed ✅");
    Ok(())
}