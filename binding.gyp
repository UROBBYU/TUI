{
	"targets": [{
		"target_name": "winfix",
		"conditions": [["OS=='win'", {"sources": ["src/gyp/fix_win.cpp"]}]],
		"dependencies": ["<!(node -p \"require('node-addon-api').targets\"):node_addon_api_except"]
	}]
}