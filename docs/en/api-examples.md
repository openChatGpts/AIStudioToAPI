# API Usage Examples

This document provides simple API usage examples, including both OpenAI-compatible API and Gemini native API formats.

## 🤖 OpenAI-Compatible API

```bash
curl -X POST http://localhost:7860/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key-1" \
  -d '{
    "model": "gemini-2.5-flash-lite",
    "messages": [
      {
        "role": "user",
        "content": "Hello, how are you?"
      }
    ],
    "stream": false
  }'
```

### 🌊 Streaming Response

```bash
curl -X POST http://localhost:7860/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key-1" \
  -d '{
    "model": "gemini-2.5-flash-lite",
    "messages": [
      {
        "role": "user",
        "content": "Write a short poem about autumn"
      }
    ],
    "stream": true
  }'
```

### 🖼️ 生成图片

#### 流式生成图片

```bash
curl -X POST http://localhost:7860/v1/chat/completions \ 
  -H "Content-Type: application/json" \ 
  -H "Authorization: Bearer your-api-key-1" \ 
  -d '{ 
    "model": "gemini-2.5-flash-image", 
    "messages": [ 
      { 
        "role": "user", 
        "content": "Generate a kitten" 
      } 
    ], 
    "stream": false
  }'
```

#### 非流式生成图片

```bash
curl -X POST http://localhost:7860/v1/chat/completions \ 
  -H "Content-Type: application/json" \ 
  -H "Authorization: Bearer your-api-key-1" \ 
  -d '{ 
    "model": "gemini-2.5-flash-image", 
    "messages": [ 
      { 
        "role": "user", 
        "content": "Generate a kitten" 
      } 
    ], 
    "stream": true
  }'
```

## ♊ Gemini Native API Format

```bash
curl -X POST http://localhost:7860/v1beta/models/gemini-2.5-flash-lite:generateContent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key-1" \
  -d '{
    "contents": [
      {
        "role": "user",
        "parts": [
          {
            "text": "Hello, how are you?"
          }
        ]
      }
    ]
  }'
```

### 🌊 Streaming Content Generation

```bash
curl -X POST http://localhost:7860/v1beta/models/gemini-2.5-flash-lite:streamGenerateContent?alt=sse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key-1" \
  -d '{
    "contents": [
      {
        "role": "user",
        "parts": [
          {
            "text": "Write a short poem about autumn"
          }
        ]
      }
    ]
  }'
```

### 🖼️ 生成图片

#### 流式生成图片

```bash
curl -X POST http://localhost:7860/v1beta/models/gemini-2.5-flash-image:streamGenerateContent?alt=sse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key-1" \
  -d '{
    "contents": [
      {
        "role": "user",
        "parts": [
          {
            "text": "Generate a kitten"
          }
        ]
      }
    ]
  }'
```

#### 非流式生成图片

```bash
curl -X POST http://localhost:7860/v1beta/models/gemini-2.5-flash-image:generateContent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key-1" \
  -d '{
    "contents": [
      {
        "role": "user",
        "parts": [
          {
            "text": "Generate a kitten"
          }
        ]
      }
    ]
  }'
```
