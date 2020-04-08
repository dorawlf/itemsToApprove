import { LightningElement, api, wire, track } from "lwc";
import getItemsToApprove from "@salesforce/apex/ItemsToApproveUtility.getItemsToApprove";
import approve from "@salesforce/apex/ItemsToApproveUtility.approve";
import reject from "@salesforce/apex/ItemsToApproveUtility.reject";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { refreshApex } from "@salesforce/apex";

const columns = [
  {
    label: "Id",
    fieldName: "Id_url",
    type: "url",
    typeAttributes: {
      label: { fieldName: "Id" },
      tooltip: { fieldName: "Id" }
    }
  },
  { label: "Name", fieldName: "Name" },
  { label: "Submitter", fieldName: "Submitter" },
  {
    label: "Date Submitted",
    fieldName: "DateSubmitted",
    type: "date",
    typeAttributes: {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }
  },
  // {
  //   label: "Action",
  //   type: "button",
  //   typeAttributes: {
  //     name: "Approve_Reject",
  //     title: "Approve or Reject",
  //     label: "Approve or Reject"
  //   }
  // }
  {
    label: "Action",
    type: "action",
    typeAttributes: {
      rowActions: [
        {
          label: "Approve",
          name: "approve_diglog"
        },
        {
          label: "Reject",
          name: "reject_dialog"
        }
      ],
      menuAlignment: "auto"
    }
  }
];

export default class ItemsToApprove extends LightningElement {
  @track columns = columns;
  @track comment = "";
  @track items;
  @track bShowModal = false;

  isApproveDialog = true;
  @track PIWIId;
  @track itemsToApprove = [];
  @track records;
  @wire(getItemsToApprove)
  wiredItems(result) {
    this.records = result;
    const { data, error } = result;
    console.log(data);
    if (data && data.length > 0) {
      // let element = data[0];
      // this.items = [
      //   {
      //     PIWIId: element.Id,
      //     Id_url: "/" + element.Id,
      //     Id: element.ProcessInstance.TargetObjectId,
      //     Name: element.ProcessInstance.TargetObject.Name,
      //     Submitter: element.CreatedBy.Name,
      //     DateSubmitted: element.CreatedDate
      //   }
      // ];

      // for (let i = 1; i < data.length; i++) {
      //   element = data[i];
      //   this.items = [
      //     ...this.items,
      //     {
      //       PIWIId: element.Id,
      //       Id_url: "/" + element.Id,
      //       Id: element.ProcessInstance.TargetObjectId,
      //       Name: element.ProcessInstance.TargetObject.Name,
      //       Submitter: element.CreatedBy.Name,
      //       DateSubmitted: element.CreatedDate
      //     }
      //   ];
      // }

      data.forEach((element) => {
        let itemToApprove = {};
        itemToApprove.PIWIId = element.Id;
        itemToApprove.Id_url = "/" + element.Id;
        itemToApprove.Id = element.ProcessInstance.TargetObjectId;
        itemToApprove.Name = element.ProcessInstance.TargetObject.Name;
        itemToApprove.Submitter = element.CreatedBy.Name;
        itemToApprove.DateSubmitted = element.CreatedDate;
        this.itemsToApprove.push(itemToApprove);
      });

      this.items = this.itemsToApprove;
    } else if (data && data.length === 0) {
      this.items = null;
    } else if (error) {
      console.log("Fails to fetch data from server");
      console.log("Error:" + Json.stringify(error));
    }
  }

  ApproveOrReject(event) {
    let actionName = event.detail.action.name;
    this.PIWIId = event.detail.row.PIWIId;

    switch (actionName) {
      case "approve_diglog":
        this.isApproveDialog = true;
        this.openModal();
        break;

      case "reject_dialog":
        this.isApproveDialog = false;
        this.openModal();
        break;

      case "approve":
        this.ApproveItem(this.PIWIId);
        break;

      case "reject":
        this.RejectItem(this.PIWIId);
        break;
    }
  }

  openModal() {
    this.bShowModal = true;
  }

  closeModal() {
    this.bShowModal = false;
  }

  approveItem() {
    var evt;
    approve({
      sfid: PIWIId,
      comment: comment
    }).then((result) => {
      refreshApex(this.records);

      if (result) {
        evt = new ShowToastEvent({
          title: "Approve",
          message: "This itmes is approved.",
          variant: this.variant
        });
      } else {
        evt = new ShowToastEvent({
          title: "Approve",
          message: "Error occourd while approving this item.",
          variant: this.variant
        }).catch((error) => {
          console.log(error);
        });
      }
      this.dispatchEvent(evt);
    });
    this.bShowModal = false;
  }

  rejectItem() {
    var evt;
    reject({
      sfid: this.PIWIId,
      comment: this.comment
    })
      .then((result) => {
        refreshApex(this.records);

        if (result) {
          evt = new ShowToastEvent({
            title: "Reject",
            message: "This item is rejected",
            variant: this.variant
          });
        } else {
          evt = new ShowToastEvent({
            title: "Approve",
            message: "Error occourd while approving this item.",
            variant: this.variant
          });
        }
        this.dispatchEvent(evt);
      })
      .catch((error) => {
        console.log("error is: " + json.stringify(error));
      });
    this.bShowModal = false;
  }

  setComment(event) {
    this.comment = event.target.value;
  }
}
