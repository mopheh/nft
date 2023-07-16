import React, { useEffect, useState } from "react";
import logo from "../../assets/logo.png";
import { Actor, HttpAgent } from '@dfinity/agent'
import { idlFactory } from "../../../declarations/nft";
import { idlFactory as tokenIdlFactory } from "../../../declarations/token";
import { Principal } from "@dfinity/principal"
import Button from "./Button";
import { opend } from "../../../declarations/opend";
import CURRENT_USER_ID from "../index";
import PriceLabel from "./PriceLabel";

function Item({ NFTID, role }) {
  const [ name, setName ] = useState()
  const [ owner, setOwner ] = useState()
  const [ image, setImage ] = useState()
  const [ button, setButton ] = useState()
  const [listed, setListed] = useState()
  const [priceInput, setPriceInput] = useState()
  const [ blur, setBlur ] = useState();
  const [loaderHidden, setLoaderHidden] = useState(true)
  const [priceLabel, setPriceLabel] = useState()
  const [shouldDisplay, setDisplay] = useState(true)
  const id = (NFTID)
  const localHost = 'http://localhost:8080/'
  const agent = new HttpAgent({host: localHost})
  agent.fetchRootKey();
  let NFTActor
  //loading function from NFT canister
  async function loadNFT() {
    NFTActor = await Actor.createActor(idlFactory, {
      agent,
      canisterId: NFTID
    })
    const name = await NFTActor.getName();
    const owner = await NFTActor.getOwner();
    const imageData = await NFTActor.getAssets();
    const imageContent = new Uint8Array(imageData)
    const image = URL.createObjectURL(new Blob([imageContent.buffer], {type: "image/png"}))
    
    
    setName(name);
    setOwner((owner).toText());
    setImage(image);
    if (role == 'collections') {
      const nftIsListed = await opend.isListed(NFTID);
      if(nftIsListed){
        setOwner('OpenD')
        setBlur({filter: "blur(4px)"})
        setListed('Listed')
      }else {
        setButton(<Button handleClick={handleSell} text={'Sell'}/>)
      }
    } else if(role == "discover") {
      const originalOwner = await opend.getOriginalOwnerId(NFTID)
      if (originalOwner.toText() != CURRENT_USER_ID.toText()) {
        setButton(<Button handleClick={handleBuy} text={'Buy'}/>)  
        const itemPrice = await opend.getListedNFTPrice(NFTID)
        setPriceLabel(<PriceLabel price={itemPrice} />)
      }
    }
  }
  let price
  function handleSell() {
    console.log('Sell clicked!!!');
    setPriceInput(<input
        placeholder="Price in DMOPH"
        type="number"
        className="price-input"
        value={price}
        onChange={ (e) => price = e.target.value}
      />) 
    setButton(<Button handleClick={sellItem} text={'Confirm'}/>)
  }

  async function sellItem() {
    setBlur({filter: "blur(4px)"})
    console.log('Sell Price')
    setLoaderHidden(false)
    const listingResult = await opend.listItem(NFTID, Number(price))
    console.log(`List Result: ${listingResult}`);
    if (listingResult == "Success") {
      let openDId = await opend.getOpenDCanisterID()
      const transferResult = await NFTActor.transferOwnerShip(openDId)
      console.log(`Transfer Result: ${transferResult}`);
      if(transferResult == 'Success'){
        setLoaderHidden(true)
        setButton()
        setPriceInput()
        setOwner("OpenD")
      }
    }
  }

  async function handleBuy() {
    setLoaderHidden(false)
    console.log('Handle Buy!!!');
    const tokenActor = await Actor.createActor(tokenIdlFactory, {
      agent,
      canisterId: Principal.fromText('renrk-eyaaa-aaaaa-aaada-cai')
    })

    const sellerId = await opend.getOriginalOwnerId(NFTID)
    const itemPrice = await opend.getListedNFTPrice(NFTID);

    const result = await tokenActor.transfer(sellerId, itemPrice)
    if (result == "Success") {
      const transferResult = await opend.completePurchase(NFTID, sellerId, CURRENT_USER_ID)
      console.log(transferResult);
    }

    setLoaderHidden(true)
    setDisplay(false)
  }

  useEffect(() => {
    loadNFT()
  }, [])



  return (
    <div style={{ display:  shouldDisplay ? 'inline' : 'none' }} className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        <img
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={image}
          style={blur}
        />
        <div className="lds-ellipsis" hidden={loaderHidden}>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div className="disCardContent-root">
          {priceLabel}
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {name}<span className="purple-text"> {listed}</span>
          </h2>
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            Owner: {owner}
          </p>
          {priceInput}
          {button}
        </div>
      </div>
    </div>
  );
}

export default Item;
