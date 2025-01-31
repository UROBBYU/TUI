#define UNICODE
#include <napi.h>
#include <windows.h>
#define MAX_MESSAGE_SIZE 1024

using namespace Napi;
using namespace std;

string lastErrorMessage() {
	static wchar_t msg[MAX_MESSAGE_SIZE];
	FormatMessage(
		FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_IGNORE_INSERTS,
		NULL, GetLastError(), 0, msg, MAX_MESSAGE_SIZE, NULL);

	int sizeNeeded = WideCharToMultiByte(CP_UTF8, 0, msg, -1, nullptr, 0, nullptr, nullptr);
	string str(sizeNeeded, 0);
	WideCharToMultiByte(CP_UTF8, 0, msg, -1, &str[0], sizeNeeded, nullptr, nullptr);

	return str;
}

Value GetMode(const CallbackInfo& info) {
	Env env = info.Env();

	HANDLE h = GetStdHandle(STD_INPUT_HANDLE);
	if (h == INVALID_HANDLE_VALUE)
		throw Error::New(env, "Unexpected error getting standard input: " + lastErrorMessage());

	DWORD mode;
	if (!GetConsoleMode(h, &mode))
		throw Error::New(env, "Unexpected error getting current console input mode: " + lastErrorMessage());

	return Number::New(env, mode);
}

void SetMode(const CallbackInfo& info) {
	Env env = info.Env();
	if (info.Length() != 1 || !info[0].IsNumber())
		throw TypeError::New(env, "Number expected");

	DWORD newMode = info[0].As<Number>().Uint32Value();
	HANDLE h = GetStdHandle(STD_INPUT_HANDLE);

	if (h == INVALID_HANDLE_VALUE)
		throw Error::New(env, "Unexpected error getting standard input: " + lastErrorMessage());

	if (!SetConsoleMode(h, newMode))
		throw Error::New(env, "Unable to set console input mode: " + lastErrorMessage());
}

Object Init(Env env, Object exports) {
	exports.Set("getConsoleMode", Function::New(env, GetMode));
	exports.Set("setConsoleMode", Function::New(env, SetMode));

	return exports;
}

NODE_API_MODULE(addon, Init)