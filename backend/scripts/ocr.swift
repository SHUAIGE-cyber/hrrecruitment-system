import Foundation
import Vision
import AppKit

// macOS 原生 OCR 工具（Vision Framework）
// 用法: ocr <图片路径>
// 输出: 识别的文本

guard CommandLine.arguments.count > 1 else {
    fputs("Usage: ocr <image-path>\n", stderr)
    exit(1)
}

let imagePath = CommandLine.arguments[1]

guard let image = NSImage(contentsOfFile: imagePath),
      let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    fputs("ERROR: Cannot load image at \(imagePath)\n", stderr)
    exit(1)
}

let request = VNRecognizeTextRequest { request, error in
    guard let observations = request.results as? [VNRecognizedTextObservation] else {
        return
    }
    for observation in observations {
        if let candidate = observation.topCandidates(1).first {
            print(candidate.string)
        }
    }
}

// 中文简体 + 英文识别，高精度模式
request.recognitionLanguages = ["zh-Hans", "en-US"]
request.recognitionLevel = .accurate
request.usesLanguageCorrection = true

let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])

do {
    try handler.perform([request])
} catch {
    fputs("ERROR: OCR failed: \(error)\n", stderr)
    exit(1)
}
