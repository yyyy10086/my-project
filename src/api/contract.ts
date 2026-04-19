import { ref } from "vue";
import { useRouter } from "vue-router";  // 导入 useRouter
import axios from "axios";


export default function (){

    const router = useRouter();
    const plaza =()=>{
        
    }

    const clickXuebiChainAccount=()=>{
        router.push("/account")
    }

    const goTotransaction =()=>{
        router.push("/transaction")
    }

    return {plaza,clickXuebiChainAccount,goTotransaction};
}