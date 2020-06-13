# AstroScript

Node.JS Library of astronomical calculations, aimed for astrology software.

There are many astronomical libraries available in the public domain. While
giving accurate results, they often suffer from lack of convenient API,
documentation and maintainability. Most of the source code is written in C, C++
or Java, and not dynamic languages. So, it is not easy for a layman to customize
them for her custom application, be it an online lunar calendar, horoscope or
tool for amateur sky observations. This library is an attempt to find a
middle-ground between precision on the one hand and compact, well organized
code on the other.

Most of the calculations are based on _"Astronomy With Your Personal Computer"_,
by _Peter Duffett-Smith_.

## Requirements

* Node.JS >= 8.16

Tested on Linux 64-bit and macOS 10.14. *Master* branch is compatible with Windows
(tested on Windows 10 Professional). But it lacks graphics modules, since
[NodeGD](https://www.npmjs.com/package/node-gd) library will not build on Windows.
To use graphics on Unix, checkout *with-graphics* branch.


## Installation

To install this module, run the following commands from the application folder:

```
$ npm install
$ npm test
```
