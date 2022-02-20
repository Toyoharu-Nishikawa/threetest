import {login} from "/necoengine/scripts/necoengine/login/index.js"
import {initialize} from "./gui/index.js"

login.setLoginButton()
login.visit()

initialize()
