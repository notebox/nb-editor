import {IframeEmitter} from "@/adapter/device/iframe"
import {launch} from "./standalone"

launch(new IframeEmitter())