import { Config } from "@remotion/cli/config"

// WebGL in headless Chrome: ANGLE draws the three.js gallery on the GPU instead of a software rasteriser
Config.setChromiumOpenGlRenderer("angle")
Config.setVideoImageFormat("jpeg")
Config.setJpegQuality(95)
Config.setCodec("h264")
Config.setCrf(16)
Config.setPixelFormat("yuv420p")
