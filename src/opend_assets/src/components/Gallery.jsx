import React, { useEffect, useState } from "react";
import Item from "./Item";
import { Principal } from '@dfinity/principal'

function Gallery({title, ids, role}) {
  const [items, setItems] = useState();
  function fetchNFTs() {
    if (ids != undefined) {
      setItems(
        ids.map( (id) => (
          <Item key={id.toText()} NFTID={id} role={role}/>
        ) )
      )
    }
  }

  useEffect(() => {
    fetchNFTs()
  }, [])

  

  return (
    <div className="gallery-view">
      <h3 className="makeStyles-title-99 Typography-h3">{title}</h3>
      <div className="disGrid-root disGrid-container disGrid-spacing-xs-2">
        <div className="disGrid-root disGrid-item disGrid-grid-xs-12">
          <div className="disGrid-root disGrid-container disGrid-spacing-xs-5 disGrid-justify-content-xs-center">
            {items}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Gallery;
