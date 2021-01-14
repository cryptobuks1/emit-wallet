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

import service from 'walletService/src/index';
import {AccountModel, ChainType} from "../types";
import selfStorage from "../utils/storage";

class WalletWorker {

    constructor() {

    }

    async importMnemonic(mnemonic: string,name:string,password:string,passwordHint:string,avatar:string) {
        const params: any = {
            mnemonic: mnemonic,
            password: password,
            passwordHint:passwordHint,
            avatar:avatar,
            name:name,
        }
        console.log("importMnemonic...",params)
        return new Promise((resolve, reject)=>{
            service.importMnemonic(params, function (data: any) {
                console.log("importMnemonic data...",data)
                if(data.error){
                    reject(data.error);
                }else{
                    resolve(data.result);
                }
            })
        })

    }

    async importPrivateKey(privateKey: string,name:string,password:string,passwordHint:string,avatar:string) {
        const params: any = {
            mnemonic: privateKey,
            password: password,
            passwordHint:passwordHint,
            avatar:avatar,
            name:name,
        }
        console.log("importPrivateKeu...",params)
        return new Promise((resolve, reject)=>{
            service.importPrivateKey(params, function (data: any) {
                console.log("importPrivateKeu data...",data)
                if(data.error){
                    reject(data.error);
                }else{
                    resolve(data.result);
                }
            })
        })

    }

    async generateMnemonic(){
        return new Promise((resolve, reject)=>{
            service.generateMnemonic(function (data:any){
                console.log("data>",data);
                if(data.error){
                    reject(data.error);
                }else{
                    resolve(data.result);
                }
            })
        })
    }

    async exportMnemonic(accountId:string,password:string){
        return new Promise((resolve, reject)=>{
            service.exportMnemonic(accountId,password,function (data:any){
                if(data.error){
                    reject(data.error);
                }else{
                    resolve(data.result);
                }
            })
        })
    }

    async exportKeystore(accountId:string){
        return new Promise((resolve, reject)=>{
            service.exportKeystore(accountId,function (data:any){
                if(data.error){
                    reject(data.error);
                }else{
                    resolve(data.result);
                }
            })
        })
    }

    async exportPrivateKey(accountId:string,password:string){
        return new Promise((resolve, reject)=>{
            service.exportPrivateKey(accountId,password,function (data:any){
                if(data.error){
                    reject(data.error);
                }else{
                    resolve(data.result);
                }
            })
        })
    }

    async accounts(){
        return new Promise((resolve, reject)=>{
            service.accounts(function (data:any){
                if(data.error){
                    reject(data.error);
                }else{
                    resolve(data.result);
                }
            })
        })
    }

    async accountInfo(accountId?:any):Promise<AccountModel>{
        if(!accountId){
            accountId = selfStorage.getItem("accountId");
        }
        service.exportKeystore(accountId,function (r:any){
            console.log(r,"meno..")
        })
        return new Promise((resolve, reject)=>{
            if(accountId) {
                const data:any = selfStorage.getItem(accountId);
                if(data){
                    resolve(data);
                }else{
                    service.accountInfo(accountId,function (data:any){
                        if(data.error){
                            reject(data.error);
                        }else{
                            selfStorage.setItem(accountId,data.result)
                            resolve(data.result);
                        }
                    })
                }
            }else{
                reject("Account not asset!")
            }
        })
    }

    async signTx(accountId:string,password:string,chainType:any,params:any,chainParams?:any){
        return new Promise((resolve, reject)=>{
            service.signTx(accountId,password,chainType,params,chainParams, function (data:any){
                if(data.error){
                    reject(data.error);
                }else{
                    resolve(data.result);
                }
            })
        })
    }
}

const walletWorker = new WalletWorker();
export default walletWorker