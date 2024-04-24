import type {ReplicaData} from "@/adapter/dataManipulator/nbCRDT/crdt"

import {
  genBlockID,
  NoteBlockType,
  BlockType,
  Color,
  BlockPropKey,
} from "@/domain/entity"

const noteBlockID = genBlockID()
const tableBlockID = genBlockID()
export const stateData: ReplicaData = {
  replicaID: 2022,
  blocks: [
    [
      noteBlockID,
      {},
      [[0, 0, 1]],
      {
        TYPE: [null, NoteBlockType],
      },
      false,
      [[[[999, 1, 2]], [[[7]], "Notebox"]]],
    ],
    [
      genBlockID(),
      {},
      [[2147483647, 1001, 1]],
      {
        TYPE: [null, BlockType.Header1],
      },
      false,
      [[[[999, 1001, 2]], [[[7]], "Notebox"]]],
      noteBlockID,
    ],
    [
      genBlockID(),
      {},
      [[2147483640, 1331, 1]],
      {
        TYPE: [null, BlockType.Database],
        DB_TEMPLATE: [null, BlockPropKey.DBBoard],
        DB_TABLE_ID: [null, tableBlockID],
        DB_BOARD: {
          FIELD_ID: [null, "1031-3"],
          FIELDS: {
            "1031-3": {
              ORDER: [null, 0],
              VISIBLE: [null, false],
              LABELS: {
                "1-1": {
                  ORDER: [null, 0],
                  VISIBLE: [null, true],
                },
                "1-2": {
                  ORDER: [null, 1],
                  VISIBLE: [null, true],
                },
              },
            },
            "1031-2": {
              ORDER: [null, 1],
              VISIBLE: [null, false],
            },
          },
        },
      },
      false,
      undefined,
      noteBlockID,
    ],
    [
      tableBlockID,
      {},
      [[2147483647, 1031, 1]],
      {
        TYPE: [null, BlockType.Database],
        DB_TEMPLATE: [null, BlockPropKey.DBSpreadsheet],
        CAPTION: [
          null,
          "asoifjeowijfoaewijfoiaewjfoawjfoaiwjfoiwjfioawofjowijfo",
        ],
        DB_TABLE: {
          "1031-1": {NAME: [null, "title"]},
          "1031-2": {NAME: [null, "series"]},
          "1031-3": {
            NAME: [null, "selection"],
            TYPE: [null, "LABEL"],
            LABELS: {
              "1-1": {
                ORDER: [null, 0],
                NAME: [null, "hello"],
              },
              "1-2": {
                ORDER: [null, 1],
                NAME: [null, "world"],
                COLOR: [null, Color.Red],
              },
              "1-3": {
                ORDER: [null, 2],
                NAME: [null, "foo"],
                COLOR: [null, Color.Blue],
              },
              "1-4": {
                ORDER: [null, 3],
                NAME: [null, "bar"],
                COLOR: [null, Color.Green],
              },
              "1-5": {
                ORDER: [null, 4],
                NAME: [null, "baz"],
                COLOR: [null, Color.Yellow],
              },
            },
          },
          "1031-4": {
            NAME: [null, "selections"],
            TYPE: [null, "LABELS"],
            LABELS: {
              "1-1": {
                ORDER: [null, 0],
                NAME: [null, "hello"],
              },
              "1-2": {
                ORDER: [null, 1],
                NAME: [null, "world"],
                COLOR: [null, Color.Red],
              },
            },
          },
          "1031-5": {
            NAME: [null, "formula"],
            TYPE: [null, "FORMULA"],
            FORMULA: [null, ["add", ["prop", "1031-1"], ["prop", "1031-2"]]],
          },
          "1031-6": {
            NAME: [null, "now"],
            TYPE: [null, "DATE"],
          },
          "1031-7": {
            NAME: [null, "multiplied"],
            TYPE: [null, "FORMULA"],
            FORMULA: [
              null,
              ["multiply", ["prop", "1031-1"], ["prop", "1031-2"]],
            ],
          },
          "1031-8": {
            NAME: [null, "bool"],
            TYPE: [null, "BOOLEAN"],
          },
        },
        DB_SPREADSHEET: {
          FIELDS: {
            "1031-1": {
              ORDER: [null, 0],
              VISIBLE: [null, true],
            },
            "1031-2": {
              ORDER: [null, 1],
              VISIBLE: [null, false],
            },
            "1031-3": {
              ORDER: [null, 2],
              VISIBLE: [null, true],
              AGGREGATION: [null, "percentNotEmpty"],
            },
          },
          // FILTER: [null, ['notLess', ['prop', '1031-1'], '0']],
          // SORT: [null, [['1031-1', true]]],
        },
      },
      false,
      undefined,
      noteBlockID,
    ],
    [
      genBlockID(),
      {},
      [[2147483647, 3011, 1]],
      {
        TYPE: [null, BlockType.DBRecord],
        DB_RECORD: {
          "1031-1": {
            VALUE: [null, ["FORMULA", ["multiply", ["prop", "1031-2"], "3"]]],
          },
          "1031-2": {
            VALUE: [null, ["FORMULA", ["greater", "2", "3"]]],
          },
          "1031-3": {
            VALUE: [null, ["LABELS", ["1-1", "1-2"]]],
          },
          "1031-4": {
            VALUE: [null, ["LABELS", ["1-1", "1-2"]]],
          },
        },
      },
      false,
      undefined,
      tableBlockID,
    ],
    [
      genBlockID(),
      {},
      [[2147483647, 3011, 2]],
      {
        TYPE: [null, BlockType.DBRecord],
        DB_RECORD: {
          "1031-1": {
            VALUE: [null, "12345"],
          },
          "1031-2": {
            VALUE: [null, "3"],
          },
          "1031-6": {
            VALUE: [
              null,
              [
                "DATE",
                {
                  start: "2022-01-08T01:02",
                  end: "2022-01-09T01:02",
                  time: true,
                },
              ],
            ],
          },
        },
      },
      false,
      undefined,
      tableBlockID,
    ],
    [
      genBlockID(),
      {},
      [[2147483647, 1100, 1]],
      {
        TYPE: [null, BlockType.Line],
      },
      false,
      [
        [
          [[999, 1100, 2]],
          [[[6], [5, {FCOL: Color.Red}], [1]], "hello world!"],
        ],
        [[[9999, 1100, 14]], [[[2, {B: true, A: "https://google.com"}]], ":)"]],
      ],
      noteBlockID,
    ],
    [
      genBlockID(),
      {},
      [[2147483647, 1110, 1]],
      {
        TYPE: [null, BlockType.UnorderedList],
      },
      false,
      [[[[999, 1110, 2]], [[[16]], "unordered list A"]]],
      noteBlockID,
    ],
    [
      genBlockID(),
      {},
      [[2147483647, 1111, 1]],
      {
        TYPE: [null, BlockType.CheckList],
      },
      false,
      [[[[999, 1111, 2]], [[[12]], "check list A"]]],
      noteBlockID,
    ],
    [
      genBlockID(),
      {},
      [[2147483647, 1112, 1]],
      {
        TYPE: [null, BlockType.OrderedList],
      },
      false,
      [[[[999, 1112, 2]], [[[14]], "ordered list A"]]],
      noteBlockID,
    ],
    [
      genBlockID(),
      {},
      [[2147483647, 1113, 1]],
      {
        TYPE: [null, BlockType.OrderedList],
      },
      false,
      [[[[999, 1113, 2]], [[[14]], "ordered list B"]]],
      noteBlockID,
    ],
    [
      genBlockID(),
      {},
      [[2147483647, 1120, 1]],
      {
        TYPE: [null, BlockType.Image],
        SRC: [
          null,
          "https://picsum.photos/seed/picsum/2048/1024",
        ],
        W: [null, 4294967295],
        H: [null, 248],
        CAPTION: [null, "picsum"],
      },
      false,
      undefined,
      noteBlockID,
    ],
    [
      genBlockID(),
      {},
      [[2147483647, 1121, 1]],
      {
        TYPE: [null, BlockType.Line],
      },
      false,
      [[[[999, 1121, 2]], [[[6]], "Blocks"]]],
      noteBlockID,
    ],
    [
      genBlockID(),
      {},
      [[2147483647, 1122, 1]],
      {
        TYPE: [null, BlockType.Divider],
      },
      false,
      undefined,
      noteBlockID,
    ],
    [
      genBlockID(),
      {},
      [[2147483647, 1123, 1]],
      {
        TYPE: [null, BlockType.Mermaid],
      },
      false,
      [[[[999, 1123, 2]], [[[24]], "graph LR\nStart --> Stop"]]],
      noteBlockID,
    ],
    [
      genBlockID(),
      {},
      [[2147483647, 1124, 1]],
      {
        TYPE: [null, BlockType.Codeblock],
        LANG: [null, "html"],
      },
      false,
      [
        [
          [[999, 1124, 2]],
          [
            [[198]],
            "<!DOCTYPE html>\n<html>\n<head>\n<link href=\"prism.css\" rel=\"stylesheet\" />\n</head>\n<body>\n<script src=\"prism.js\"></script>\n<pre><code class=\"language-css\">p { color: red }</code></pre>\n</body>\n</html>",
          ],
        ],
      ],
      noteBlockID,
    ],
    [
      genBlockID(),
      {},
      [[2147483647, 1129, 1]],
      {
        TYPE: [null, BlockType.Line],
      },
      false,
      [[[[999, 1129, 2]], [[[4]], "Done"]]],
      noteBlockID,
    ],
    [
      genBlockID(),
      {},
      [[2147483647, 1130, 1]],
      {
        TYPE: [null, BlockType.Linkblock],
        LINK: [null, "https://notebox.cloud"],
      },
      false,
      undefined,
      noteBlockID,
    ],
  ],
}
