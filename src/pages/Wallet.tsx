/**
 * Copyright 2020 EMIT Foundation.
 This file is part of E.M.I.T. .

 E.M.I.T. is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 E.M.I.T. is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with E.M.I.T. . If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';
import {
    IonAvatar,
    IonButton,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonItemGroup,
    IonLabel,
    IonList,
    IonListHeader,
    IonPage, IonCard, IonCardSubtitle, IonCardTitle, IonCardContent,
    IonText,
    IonTitle,
    IonToolbar, IonAlert
} from '@ionic/react';
import * as utils from '../utils';
import './Wallet.css';
import {
    chevronForwardOutline, linkOutline, qrCodeSharp, scanOutline,
} from 'ionicons/icons'

import {BRIDGE_CURRENCY, TOKEN_DESC} from "../config"

import walletWorker from "../worker/walletWorker";
import {AccountModel, ChainType} from "../types";
import rpc from "../rpc";
import selfStorage from "../utils/storage";
import url from "../utils/url";
import BigNumber from "bignumber.js";
import {
    Plugins,
} from '@capacitor/core';
import {BarcodeScanner} from '@ionic-native/barcode-scanner';
import i18n from '../locales/i18n'

const {StatusBar,Device} = Plugins;

interface State {
    account: AccountModel
    assets: any
    coinShow: any
    showAlert: boolean
    chain: any
    showVersionAlert:boolean
    version:any
    deviceInfo:any
    scanText:string
}

class Wallet extends React.Component<State, any> {

    state: State = {
        account: {name: ""},
        assets: {},
        coinShow: {},
        showAlert: false,
        chain: "",
        showVersionAlert:false,
        version:{},
        deviceInfo:{},
        scanText:""
    }

    componentDidMount() {
        StatusBar.setBackgroundColor({
            color: "#194381"
        })
        walletWorker.accountInfo().then((account:any)=>{
            const assets: any = {};
            const currencies: Array<string> = Object.keys(BRIDGE_CURRENCY);
            for (let cy of currencies) {
                const chains = Object.keys(BRIDGE_CURRENCY[cy]);
                assets[cy] = {}
                for (let chain of chains) {
                    if (chain === "SERO") {
                        assets[cy][chain] = "0";
                    } else if (chain === "ETH") {
                        assets[cy][chain] = "0";
                    }
                }
            }
            this.setState({
                account: account,
                assets:assets
            })
        });

        this.init().then(() => {
        }).catch()
        let initInterValId: any = sessionStorage.getItem("initInterValId");
        if (initInterValId) {
            clearInterval(initInterValId)
        }
        initInterValId = setInterval(() => {
            this.init().then(() => {
            }).catch()
        }, 5000)
        sessionStorage.setItem("initInterValId", initInterValId);

        setTimeout(()=>{
            this.checkVersion().catch()
        },1000)
    }

    checkVersion = async () => {
        const deviceInfo = await Device.getInfo();
        if(deviceInfo && deviceInfo.platform !=="web"){
            const skipVersion: any = selfStorage.getItem("skipVersion");
            const remoteVersion:any = await rpc.post("eth_getAppVersion", ["latest",""])

            if (remoteVersion && remoteVersion.length>0) {
                if (skipVersion && skipVersion.length > 0) {
                    if (skipVersion.indexOf(remoteVersion[0].version) > -1) {
                        return
                    }
                }

                if(remoteVersion[0].show && deviceInfo.appVersion !== remoteVersion[0].version){
                    this.setState({
                        showVersionAlert:true,
                        version:remoteVersion[0],
                        deviceInfo:deviceInfo
                    })
                }
            }
        }
    }

    init = async () => {
        const account = await walletWorker.accountInfo();
        const assets: any = {};
        const currencies: Array<string> = Object.keys(BRIDGE_CURRENCY);
        if (account && account.addresses && account.addresses[2]) {
            const seroBalance = await rpc.getBalance(ChainType.SERO, account.addresses[ChainType.SERO])
            const ethBalance = await rpc.getBalance(ChainType.ETH, account.addresses[ChainType.ETH])
            for (let cy of currencies) {
                const chains = Object.keys(BRIDGE_CURRENCY[cy]);
                assets[cy] = {}
                for (let chain of chains) {
                    const currency = utils.getCyName(cy, chain);
                    if (chain === "SERO") {
                        assets[cy][chain] = utils.fromValue(seroBalance[currency], utils.getCyDecimal(cy, chain)).toString(10);
                    } else if (chain === "ETH") {
                        assets[cy][chain] = utils.fromValue(ethBalance[currency], utils.getCyDecimal(cy, chain)).toString(10);
                    }
                }
            }
        }

        this.setState({
            assets: assets
        })
    }

    getBalance = async () => {
    }

    openScanner = async () => {
        const data = await BarcodeScanner.scan({
            formats: "QR_CODE",
            prompt: "Scan QR Code"
        });
        if (data.text) {
            this.setState({
                scanText:data.text
            })
            if (data.text && data.text.indexOf("0x") == 0) {
                this.setShowAlert(true, "ETH")
            } else if (data.text && data.text.indexOf("http") == 0) {
                Plugins.Browser.open({url: data.text}).catch(e => {
                    console.log(e)
                })
            } else {
                this.setShowAlert(true, "SERO")
            }
        }
    };

    renderAssets = () => {
        const {assets, coinShow} = this.state;
        const assetsKeys = Object.keys(assets);
        const itemGroup: Array<any> = [];

        for (let cy of assetsKeys) {
            const tokens = assets[cy];
            const tokenKeys = Object.keys(tokens);
            const item: Array<any> = [];
            let total: BigNumber = new BigNumber(0)
            for (let chain of tokenKeys) {
                const value = new BigNumber(tokens[chain]);
                const currency = utils.getCyName(cy, chain);
                total = new BigNumber(value).plus(total)
                item.push(
                    <IonItem mode="ios" lines="none" style={{marginBottom:"5px"}}>
                        <IonAvatar slot="start" onClick={() => {
                            // window.location.href = `#/transaction/list/${chain}/${cy}`
                            url.transactionList(cy, chain);
                        }}>
                            <IonIcon src={linkOutline} size="large" color="primary"/>
                            <div>
                                <IonText color="primary" className={`coin-chain-${chain.toLowerCase()}`}>
                                    {(chain == "ETH" ? "ethereum" : chain).toLowerCase()}
                                </IonText>
                            </div>
                        </IonAvatar>
                        <IonLabel slot="start" onClick={() => {
                            // window.location.href = `#/transaction/list/${chain}/${cy}`
                            url.transactionList(cy, chain);
                        }}>
                            {/*<IonText>{parseFloat(value.toFixed(3, 1)).toLocaleString()}</IonText>*/}
                            <IonText>{value.toString(10)}</IonText>
                            <p><IonText
                                color="medium">{currency}{utils.getCyType(chain, cy) && `(${utils.getCyType(chain, cy)})`}</IonText>
                            </p>
                        </IonLabel>
                        <IonButton slot="end" mode="ios" size="small" onClick={() => {
                            // window.location.href=`#/transfer/${cy}/${chain}`
                            // window.location.reload();
                            url.transfer(cy, chain);
                        }} fill="outline">{i18n.t("transfer")}</IonButton>
                        <IonIcon src={chevronForwardOutline} color="medium" slot="end" onClick={() => {
                            // window.location.href = `#/transaction/list/${chain}/${cy}`
                            url.transactionList(cy, chain);
                        }}/>
                    </IonItem>
                )
            }

            itemGroup.push(<IonCard mode="ios" onClick={(e) => {
                coinShow[cy] = !coinShow[cy];
                this.setState({
                    coinHidden: coinShow
                })
            }}>
                <IonItem lines="none" style={{margin: "10px 0 0"}}>
                    <IonAvatar slot="start">
                        <img src={require(`../img/${cy}.png`)}/>
                    </IonAvatar>
                    <IonCardTitle slot="start">
                        {cy}
                        <IonCardSubtitle>{TOKEN_DESC[cy]}</IonCardSubtitle>
                    </IonCardTitle>
                    <IonLabel className="text-bold">{parseFloat(total.toFixed(3, 1)).toLocaleString()}</IonLabel>
                    {cy != "ETH" && <IonButton size="small" slot="end" mode="ios" onClick={() => {
                        url.tunnel(cy)
                    }} style={{float: "right"}}>{i18n.t("cross")}</IonButton>}
                </IonItem>
                <IonCardContent hidden={!coinShow[cy]}>
                    <IonItemGroup>
                        {item}
                    </IonItemGroup>
                </IonCardContent>
            </IonCard>)
        }
        return itemGroup;
    }

    setShowAlert = (f: boolean, chain?: string) => {
        this.setState({
            showAlert: f,
            chain: chain
        })
    }

    getTokenList = (): Array<any> => {
        const {assets, chain} = this.state;
        if (!chain) {
            return []
        }
        const assetsKeys = Object.keys(assets);
        const items: Array<any> = [];
        for (let i = 0; i < assetsKeys.length; i++) {
            const cy = assetsKeys[i];
            // const tokens = assets[cy];
            // console.log(tokens, "tokens");
            // const value = new BigNumber(tokens[chain]).toNumber();
            if (assets[cy][chain]) {
                items.push({
                    name: cy,
                    type: 'radio',
                    label: cy,
                    value: cy,
                    checked: items.length == 0
                })
            }
        }
        return items;
    }

    setShowVersionAlert = (f:boolean) =>{
        this.setState({
            showVersionAlert:f
        })
    }

    render() {
        const {account,scanText, showAlert, chain,showVersionAlert,version,deviceInfo} = this.state;

        return (
            <IonPage>
                <IonContent fullscreen color="light">
                    <IonHeader mode="ios">
                        <IonToolbar color="primary" mode="ios">
                            <IonTitle>{i18n.t("wallet")}</IonTitle>
                            {
                                utils.IsAPP() &&
                                <IonIcon onClick={() => {
                                    this.openScanner().catch();
                                }} src={scanOutline} size="large" slot="end"/>
                            }
                        </IonToolbar>
                    </IonHeader>
                    <IonList color="light">
                        <IonListHeader color="light" mode="ios">
                            <IonLabel><IonText color="medium">{i18n.t("hello")} </IonText>{account.name} </IonLabel>
                        </IonListHeader>
                        <IonItem mode="ios" lines="none" onClick={() => {
                            url.receive(account.addresses[ChainType.ETH])
                        }}>
                            <IonAvatar slot="start">
                                <img src={require(`../img/ETH.png`)}/>
                            </IonAvatar>
                            <IonLabel className="address-wrap" mode="ios">
                                <IonText>{account.addresses && utils.ellipsisStr(account.addresses[ChainType.ETH])}</IonText>
                                <p><IonText color="medium">{ChainType[ChainType.ETH]} {i18n.t("chain")}</IonText></p>
                            </IonLabel>
                            <IonIcon src={qrCodeSharp} slot="end" color="medium"/>
                        </IonItem>
                        <IonItem mode="ios" lines="none" onClick={() => {
                            url.receive(account.addresses && account.addresses[ChainType.SERO])
                        }}>
                            <IonAvatar slot="start">
                                <img src={require(`../img/SERO.png`)}/>
                            </IonAvatar>
                            <IonLabel className="address-wrap" mode="ios">
                                <IonText>{account.addresses && utils.ellipsisStr(account.addresses[ChainType.SERO])}</IonText>
                                <p><IonText color="medium">{ChainType[ChainType.SERO]} {i18n.t("chain")}</IonText></p>
                            </IonLabel>
                            <IonIcon src={qrCodeSharp} slot="end" color="medium"/>
                        </IonItem>
                    </IonList>

                    {this.renderAssets()}

                </IonContent>

                <IonAlert
                    isOpen={showAlert}
                    onDidDismiss={() => this.setShowAlert(false)}
                    header={"Select Token"}
                    inputs={this.getTokenList()}
                    buttons={[
                        {
                            text: i18n.t("cancel"),
                            role: 'cancel',
                            cssClass: 'secondary',
                            handler: () => {
                                console.log('Confirm Cancel');
                            }
                        },
                        {
                            text: i18n.t("transfer"),
                            handler: (cy) => {
                                console.log('Confirm Ok', cy);
                                url.transfer(cy, chain,scanText)
                            }
                        }
                    ]}
                />

                <IonAlert
                    mode="ios"
                    isOpen={showVersionAlert}
                    onDidDismiss={() => this.setShowVersionAlert(false)}
                    header={`New Version ${version.version}`}
                    message={`${version.info}`}
                    buttons={[
                        {
                            text:  i18n.t("cancel"),
                            role: 'cancel',
                            cssClass: 'secondary',
                            handler: () => {
                                console.log('Confirm Cancel');
                            }
                        },
                        {
                            text: i18n.t("upgrade"),
                            handler: () => {
                                if(deviceInfo.platform == "ios"){
                                    Plugins.App.openUrl({url:version.iosUrl}).catch()
                                }else if (deviceInfo.platform == "android"){
                                    Plugins.Browser.open({url:version.androidUrl}).catch()
                                }
                            }
                        }
                    ]}
                />

            </IonPage>
        );
    }
};

export default Wallet;